import { GoogleGenAI } from "@google/genai";
import fs from "fs/promises";
import path from "path";
import { Response } from "express";
import { serverTools, executeServerTool } from "./geminiService.js";
import { autoDeployWebsiteFromText, getNexusSystemInstruction, prepareGeminiHistoryAndLastMessage } from "./websiteDeployer.js";

export interface KeyConfig {
  id: string;
  provider: 'gemini' | 'openrouter' | 'grok';
  name: string;
  apiKey: string;
  model: string;
  isActive: boolean;
  rpmLimit: number;
  status?: 'healthy' | 'cooldown' | 'error';
  lastError?: string | null;
}

interface KeyRuntimeStats {
  timestamps: number[]; // timestamps in last 60s
  cooldownUntil: number;
  totalRequests: number;
  lastError: string | null;
  lastUsedAt: number;
}

const keyStatsMap = new Map<string, KeyRuntimeStats>();

export interface SystemLogEntry {
  id: string;
  timestamp: number;
  level: 'error' | 'warn' | 'info' | 'success';
  category: 'auth' | 'rate_limit' | 'rotation' | 'execution' | 'network';
  keyName?: string;
  provider?: string;
  model?: string;
  message: string;
  details?: string;
}

const systemLogs: SystemLogEntry[] = [];
const MAX_LOGS = 200;

export function addSystemLog(log: Omit<SystemLogEntry, 'id' | 'timestamp'>) {
  const entry: SystemLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    ...log
  };
  systemLogs.unshift(entry);
  if (systemLogs.length > MAX_LOGS) {
    systemLogs.pop();
  }
}

export function getSystemLogs(): SystemLogEntry[] {
  return systemLogs;
}

export function clearSystemLogs(): void {
  systemLogs.length = 0;
}

// Track last successful responding key so Nexus prioritizes it on subsequent turns
let lastSuccessfulKeyId: string | null = null;

const SECRETS_FILE = path.resolve(process.cwd(), '.secrets.json');

// Normalize any model name according to active @google/genai guidelines
export function normalizeModelName(provider: string, model?: string): string {
  if (provider === 'gemini') {
    if (!model) return 'gemini-3.1-flash-lite';
    const lower = model.toLowerCase().trim();
    // Re-route exhausted/spiking models on Free Tier to gemini-3.1-flash-lite (1,500 RPD)
    if (
      lower.includes('1.5') ||
      lower.includes('2.0') ||
      lower.includes('2.5') ||
      lower.includes('3.8') ||
      lower.includes('gemini-pro') ||
      lower.includes('flash-latest') ||
      lower === 'gemini-flash'
    ) {
      return 'gemini-3.1-flash-lite';
    }
    const validGeminiModels = [
      'gemini-3.1-flash-lite',
      'gemini-4-argon',
      'gemini-4-carbon',
      'gemini-3.1-flash-lite-image',
      'gemini-nano-banana-2.1',
      'gemini-3-pro-image'
    ];
    if (validGeminiModels.includes(model)) return model;
    return 'gemini-3.1-flash-lite';
  }
  return model || '';
}

// Load stored secrets from disk if exists
export async function loadSecrets(): Promise<KeyConfig[]> {
  try {
    const raw = await fs.readFile(SECRETS_FILE, 'utf-8');
    const parsed: KeyConfig[] = JSON.parse(raw);
    let modified = false;
    for (const k of parsed) {
      if (k.provider === 'gemini') {
        const normalized = normalizeModelName('gemini', k.model);
        if (normalized !== k.model) {
          k.model = normalized;
          modified = true;
        }
      }
    }
    if (modified) {
      await fs.writeFile(SECRETS_FILE, JSON.stringify(parsed, null, 2), 'utf-8').catch(() => {});
    }
    return parsed;
  } catch {
    return [];
  }
}

// Save secrets to disk
export async function saveSecrets(keys: KeyConfig[]): Promise<void> {
  try {
    for (const k of keys) {
      if (k.provider === 'gemini') {
        k.model = normalizeModelName('gemini', k.model);
      }
    }
    await fs.writeFile(SECRETS_FILE, JSON.stringify(keys, null, 2), 'utf-8');
  } catch (err) {
    console.error("Failed to save secrets to disk:", err);
  }
}

// Clean old timestamps and return stats
function getOrCreateStats(keyId: string): KeyRuntimeStats {
  let stats = keyStatsMap.get(keyId);
  if (!stats) {
    stats = {
      timestamps: [],
      cooldownUntil: 0,
      totalRequests: 0,
      lastError: null,
      lastUsedAt: 0,
    };
    keyStatsMap.set(keyId, stats);
  }
  const now = Date.now();
  stats.timestamps = stats.timestamps.filter(ts => now - ts < 60_000);
  return stats;
}

// Check real-time status of all keys
export function getKeyPoolStatus(keys: KeyConfig[]) {
  const now = Date.now();
  return keys.map(k => {
    const stats = getOrCreateStats(k.id);
    const inCooldown = stats.cooldownUntil > now;
    const cooldownRemainingSec = inCooldown ? Math.ceil((stats.cooldownUntil - now) / 1000) : 0;
    const requestsThisMinute = stats.timestamps.length;
    
    let status: 'healthy' | 'cooldown' | 'error' = 'healthy';
    if (inCooldown) status = 'cooldown';
    else if (stats.lastError && requestsThisMinute === 0) status = 'error';

    return {
      id: k.id,
      provider: k.provider,
      name: k.name,
      model: k.model,
      isActive: k.isActive,
      rpmLimit: k.rpmLimit,
      status,
      cooldownUntil: stats.cooldownUntil,
      cooldownRemainingSec,
      requestsThisMinute,
      totalRequests: stats.totalRequests,
      lastError: stats.lastError,
      lastUsedAt: stats.lastUsedAt,
    };
  });
}

// Select the optimal key from the pool
export function selectBestKey(
  keys: KeyConfig[],
  preferredProvider: string = 'all',
  excludeKeyIds: Set<string> = new Set()
): { key: KeyConfig | null; reason?: string } {
  const now = Date.now();
  
  // Active and not excluded
  let candidates = keys.filter(k => k.isActive && !excludeKeyIds.has(k.id));

  // Filter by provider preference if specified
  if (preferredProvider && preferredProvider !== 'all') {
    const filtered = candidates.filter(k => k.provider === preferredProvider);
    if (filtered.length > 0) candidates = filtered;
  }

  if (candidates.length === 0) {
    return { key: null, reason: 'No active keys configured or all tried.' };
  }

  // Filter out keys currently in cooldown
  const readyKeys = candidates.filter(k => {
    const stats = getOrCreateStats(k.id);
    return stats.cooldownUntil <= now;
  });

  if (readyKeys.length === 0) {
    return { key: null, reason: 'All active keys are currently cooling down due to rate limits.' };
  }

  // Filter out keys that have reached their RPM quota
  const underRpmKeys = readyKeys.filter(k => {
    const stats = getOrCreateStats(k.id);
    return stats.timestamps.length < (k.rpmLimit || 15);
  });

  const pool = underRpmKeys.length > 0 ? underRpmKeys : readyKeys;

  // 1. Sticky Key: Try to use the last successful key first
  if (lastSuccessfulKeyId && !excludeKeyIds.has(lastSuccessfulKeyId)) {
    const preferredKey = pool.find(k => k.id === lastSuccessfulKeyId);
    if (preferredKey) {
      return { key: preferredKey, reason: 'গতবারের সফল কী অগ্রাধিকার পেয়েছে (Sticky Last Key)' };
    }
  }

  // Pick the key with lowest requests in the sliding 60s window (least loaded)
  pool.sort((a, b) => {
    const statsA = getOrCreateStats(a.id);
    const statsB = getOrCreateStats(b.id);
    return statsA.timestamps.length - statsB.timestamps.length;
  });

  return { key: pool[0] };
}

// Record successful request on key
export function recordKeySuccess(keyId: string) {
  lastSuccessfulKeyId = keyId;
  const stats = getOrCreateStats(keyId);
  const now = Date.now();
  stats.timestamps.push(now);
  stats.totalRequests++;
  stats.lastUsedAt = now;
  stats.lastError = null;
}

// Record error / cooldown on key
export function recordKeyCooldown(keyId: string, durationSec: number = 60, errorMsg?: string) {
  const stats = getOrCreateStats(keyId);
  stats.cooldownUntil = Date.now() + durationSec * 1000;
  stats.lastError = errorMsg || 'Rate limit or failure';
}

// Test an API key connectivity
export async function testApiKey(provider: string, apiKey: string, model?: string): Promise<{ success: boolean; latencyMs: number; message?: string }> {
  const start = Date.now();
  try {
    if (provider === 'gemini') {
      if (apiKey.startsWith('AQ.')) {
        return {
          success: false,
          latencyMs: 0,
          message: "Invalid Key Format: You entered an OAuth access token (starts with AQ.). A valid Google AI Studio Gemini API key starts with 'AIzaSy...'. Please generate a key at aistudio.google.com/app/apikey"
        };
      }
      const targetModel = normalizeModelName('gemini', model);
      const client = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      const res = await client.models.generateContent({
        model: targetModel,
        contents: 'Hi. Reply with only one word: OK'
      });
      const latencyMs = Date.now() - start;
      const text = res.text || '';
      return { success: true, latencyMs, message: `Connected to Gemini (${targetModel}) successfully. Response: ${text.trim().slice(0, 30)}` };
    } 
    else if (provider === 'openrouter') {
      if (apiKey.startsWith('sk-or-v1-b600f02324')) {
        return {
          success: false,
          latencyMs: 0,
          message: "Invalid Key: This is a placeholder key. Please obtain your valid API key from openrouter.ai/keys"
        };
      }
      const targetModel = model || 'google/gemini-2.0-flash-lite:free';
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://nexus-ai.local',
          'X-Title': 'Nexus AI',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [{ role: 'user', content: 'Reply with one word: OK' }],
          max_tokens: 10
        })
      });
      const latencyMs = Date.now() - start;
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenRouter returned status ${res.status}`);
      }
      return { success: true, latencyMs, message: `Connected to OpenRouter (${targetModel}) successfully.` };
    }
    else if (provider === 'grok') {
      const targetModel = model || 'grok-2-latest';
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [{ role: 'user', content: 'Reply with one word: OK' }],
          max_tokens: 10
        })
      });
      const latencyMs = Date.now() - start;
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Grok returned status ${res.status}`);
      }
      return { success: true, latencyMs, message: `Connected to Grok (${targetModel}) successfully.` };
    }
    return { success: false, latencyMs: 0, message: `Unknown provider: ${provider}` };
  } catch (err: any) {
    return { success: false, latencyMs: Date.now() - start, message: err.message || 'Connection failed' };
  }
}

// Re-export website, PWA deployer, and chat history sanitizer
export { autoDeployWebsiteFromText, prepareGeminiHistoryAndLastMessage } from "./websiteDeployer.js";

// Convert messages to standard OpenAI format for OpenRouter and Grok
function convertToOpenAIMessages(messages: any[], mode: string): any[] {
  const systemPrompt = getNexusSystemInstruction(mode);

  const formatted: any[] = [{ role: 'system', content: systemPrompt }];
  for (const m of messages) {
    const text = m.parts?.[0]?.text || m.content || '';
    if (text) {
      formatted.push({
        role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
        content: text
      });
    }
  }
  return formatted;
}

// Stream chat with OpenRouter or Grok
async function streamOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  headers: Record<string, string>,
  messages: any[],
  mode: string,
  sendEvent: (data: any) => void
): Promise<string> {
  const openAiMessages = convertToOpenAIMessages(messages, mode);
  let targetModel = model;
  let res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify({
      model: targetModel,
      messages: openAiMessages,
      stream: true
    })
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    const msg = errorJson?.error?.message || `API error ${res.status}: ${res.statusText}`;

    // Auto-recover if OpenRouter suggests a new slug or if free model slug is unavailable
    const slugMatch = msg.match(/use this slug instead:\s*([a-zA-Z0-9_\-\/:]+)/i);
    const isModelUnavailable = msg.includes("unavailable for free") || msg.includes("not available") || msg.includes("No endpoints found") || msg.includes("not found");

    if (slugMatch && slugMatch[1] && slugMatch[1] !== targetModel) {
      targetModel = slugMatch[1];
      sendEvent({
        type: "action",
        action: `Switching to available model: ${targetModel}...`
      });
      res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          model: targetModel,
          messages: openAiMessages,
          stream: true
        })
      });
    } else if (isModelUnavailable && targetModel !== 'google/gemini-2.0-flash-lite:free') {
      targetModel = 'google/gemini-2.0-flash-lite:free';
      sendEvent({
        type: "action",
        action: `Model unavailable. Auto-recovering with ${targetModel}...`
      });
      res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          model: targetModel,
          messages: openAiMessages,
          stream: true
        })
      });
    }

    if (!res.ok) {
      const secondError = await res.json().catch(() => null);
      const finalMsg = secondError?.error?.message || msg;
      const err = new Error(finalMsg);
      (err as any).status = res.status;
      throw err;
    }
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response stream available");

  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue;
      if (trimmed === 'data: [DONE]') continue;
      if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices?.[0]?.delta?.content || '';
          if (delta) {
            fullText += delta;
            sendEvent({ type: 'text', text: fullText });
          }
        } catch {
          // ignore stream chunk parse errors
        }
      }
    }
  }

  return fullText;
}

// Orchestrated Chat Execution with Multi-Key Failover and Smart Rotation
export async function handleOrchestratedChat(
  req: { 
    messages: any[]; 
    mode?: string; 
    userKeys?: KeyConfig[]; 
    preferredProvider?: string; 
    safePacing?: boolean;
    sessionId?: string;
  },
  res: Response
) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const { messages, mode = "general", userKeys = [], preferredProvider = 'all', sessionId } = req;
  
  // Extract and sanitize messages once
  const { history, lastMessage: initialLastMessage } = prepareGeminiHistoryAndLastMessage(messages);
  let lastMessage = initialLastMessage;

  // Auto-detect reference website URLs and scrape their structure, layout & copy
  const urlRegex = /(https?:\/\/[^\s<>'"]+)/gi;
  const foundUrls = initialLastMessage.match(urlRegex);
  if (foundUrls && foundUrls.length > 0) {
    const rawTargetUrl = foundUrls[0].replace(/[),.]+$/, '');
    sendEvent({
      type: "action",
      action: `🔍 Analyzing reference website: ${rawTargetUrl}...`
    });

    try {
      // 1. Try Jina Reader for clean, high-fidelity markdown layout extraction
      const jinaRes = await fetch(`https://r.jina.ai/${rawTargetUrl}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/plain,text/markdown,*/*',
        },
        signal: AbortSignal.timeout(9000),
      });

      if (jinaRes.ok) {
        const pageMarkdown = await jinaRes.text();
        if (pageMarkdown && pageMarkdown.length > 80) {
          sendEvent({
            type: "action",
            action: `✓ Scraped reference structure from ${rawTargetUrl}! Synthesizing matching design...`
          });
          lastMessage += `\n\n[REFERENCE WEBSITE CONTENT - SCRAPED FROM ${rawTargetUrl}]:
---
${pageMarkdown.slice(0, 14000)}
---
MANDATORY WEBSITE REPLICATION GUIDELINES:
1. The user requested to replicate / build a website like ${rawTargetUrl}.
2. Observe its real navbar links, brand title/logo, hero tagline, buttons, content sections, pricing/feature cards, and footer.
3. Faithfully reconstruct all these sections with modern Tailwind CSS and full responsiveness.
4. Make all elements interactive (nav buttons, tabs, modal dialogs, search filters).
5. Output the complete production code inside \`\`\`html ... \`\`\`.`;
        }
      }
    } catch (scrapeErr) {
      console.warn("Auto-scrape failed:", scrapeErr);
      lastMessage += `\n\n[SYSTEM DIRECTIVE: The user linked reference website ${rawTargetUrl}. Call webFetch with this URL or webSearch to inspect its actual features and layout before writing code.]`;
    }
  }

  // Merge user keys with any server-persisted secrets
  const diskSecrets = await loadSecrets();
  const allKeysMap = new Map<string, KeyConfig>();
  for (const k of diskSecrets) {
    if (k.provider === 'gemini') k.model = normalizeModelName('gemini', k.model);
    allKeysMap.set(k.id, k);
  }
  for (const k of userKeys) {
    if (k.provider === 'gemini') k.model = normalizeModelName('gemini', k.model);
    allKeysMap.set(k.id, k);
  }
  const activePool = Array.from(allKeysMap.values()).filter(k => 
    k.isActive && 
    k.apiKey && 
    !k.apiKey.startsWith('AQ.') && 
    !k.apiKey.startsWith('sk-or-v1-b600f02324')
  );

  if (activePool.length === 0) {
    addSystemLog({
      level: 'error',
      category: 'auth',
      message: 'রিকোয়েস্ট বাতিল: কোনো সচল সিক্রেট কী পাওয়া যায়নি। প্রাইমারি ইঞ্জিন নিষ্ক্রিয় রাখা হয়েছে।'
    });
    sendEvent({
      type: "error",
      error: "⚠️ কোনো সচল সিক্রেট কী পাওয়া যায়নি! নেক্সাস এখন শুধুমাত্র আপনার সিক্রেট কী থেকে পরিচালিত হয় (প্রাইমারি ইঞ্জিন বন্ধ রয়েছে)। অনুগ্রহ করে উপরের 🔑 (API Keys) মেনুতে আপনার Google AI Studio অথবা OpenRouter API কী যুক্ত করুন।",
      isAuthError: true
    });
    res.end();
    return;
  }

  const excludedKeyIds = new Set<string>();
  const maxAttempts = activePool.length;
  let attempts = 0;
  let succeeded = false;

  while (attempts < maxAttempts && !succeeded) {
    attempts++;
    
    // Select the best key according to RPM sliding window and health
    const { key, reason } = selectBestKey(activePool, preferredProvider, excludedKeyIds);

    if (key) {
      excludedKeyIds.add(key.id);
      const activeModel = key.provider === 'gemini' ? normalizeModelName('gemini', key.model) : (key.model || 'default');
      sendEvent({
        type: "key_active",
        keyId: key.id,
        keyName: key.name,
        provider: key.provider,
        model: activeModel,
        isCustomKey: true
      });
      sendEvent({
        type: "action",
        action: `Routing via ${key.name} (${key.provider.toUpperCase()} • ${activeModel})...`
      });

      try {
        if (key.provider === 'gemini') {
          // Execute with GoogleGenAI
          const client = new GoogleGenAI({
            apiKey: key.apiKey,
            httpOptions: { headers: { "User-Agent": "aistudio-build" } }
          });
          const targetModel = normalizeModelName('gemini', key.model);
          const chat = client.chats.create({
            model: targetModel,
            config: {
              systemInstruction: getNexusSystemInstruction(mode),
              tools: [{ functionDeclarations: serverTools }]
            },
            history
          });

          let currentResult = await chat.sendMessageStream({ message: lastMessage });
          let fullText = "";

          while (true) {
            const functionCalls: any[] = [];
            for await (const chunk of currentResult) {
              if (chunk.text) {
                fullText += chunk.text;
                sendEvent({ type: "text", text: fullText });
              }
              if (chunk.functionCalls && chunk.functionCalls.length > 0) {
                functionCalls.push(...chunk.functionCalls);
              }
            }

            if (functionCalls.length === 0) break;

            const toolResponses = await Promise.all(
              functionCalls.map(async (call) => {
                if (!call.name) return null;
                const toolResult = await executeServerTool(call.name, call.args, (action) => {
                  sendEvent({ type: "action", action });
                });
                if (call.name === "generateImage" && toolResult.imageUrl) {
                  sendEvent({ type: "image", imageUrl: toolResult.imageUrl });
                }
                return {
                  functionResponse: {
                    name: call.name,
                    response: { output: toolResult }
                  }
                };
              })
            );

            const validResponses = toolResponses.filter(Boolean);
            currentResult = await chat.sendMessageStream({ message: validResponses as any });
          }

          recordKeySuccess(key.id);
          addSystemLog({
            level: 'success',
            category: 'execution',
            keyName: key.name,
            provider: key.provider,
            model: targetModel,
            message: `✓ Success: ${key.name} responded successfully (${targetModel}). Saved as sticky key for next turn.`
          });
          const deployed = await autoDeployWebsiteFromText(fullText, sessionId);
          if (deployed.success) {
            const previewUrl = deployed.url || "/projects/index.html";
            sendEvent({ type: "action", action: `✓ Website generated & saved (${previewUrl})! Live Preview ready.` });
            sendEvent({ 
              type: "preview_ready", 
              url: previewUrl, 
              sessionId,
              html: deployed.html,
              timestamp: Date.now() 
            });
          }
          sendEvent({ 
            type: "done", 
            fullText, 
            activeKeyId: key.id,
            keyName: key.name,
            provider: key.provider,
            model: targetModel,
            isCustomKey: true
          });
          succeeded = true;
          break;
        } 
        else if (key.provider === 'openrouter') {
          const fullText = await streamOpenAICompatible(
            'https://openrouter.ai/api/v1/chat/completions',
            key.apiKey,
            key.model || 'google/gemini-2.0-flash-lite:free',
            { 'HTTP-Referer': 'https://nexus-ai.local', 'X-Title': 'Nexus AI' },
            messages,
            mode,
            sendEvent
          );

          recordKeySuccess(key.id);
          addSystemLog({
            level: 'success',
            category: 'execution',
            keyName: key.name,
            provider: key.provider,
            model: key.model || 'google/gemini-2.0-flash-lite:free',
            message: `✓ Success: ${key.name} (OpenRouter) responded successfully. Saved as sticky key for next turn.`
          });
          const deployed = await autoDeployWebsiteFromText(fullText, sessionId);
          if (deployed.success) {
            const previewUrl = deployed.url || "/projects/index.html";
            sendEvent({ type: "action", action: `✓ Website generated & saved (${previewUrl})! Live Preview ready.` });
            sendEvent({ 
              type: "preview_ready", 
              url: previewUrl, 
              sessionId,
              html: deployed.html,
              timestamp: Date.now() 
            });
          }
          sendEvent({ 
            type: "done", 
            fullText, 
            activeKeyId: key.id,
            keyName: key.name,
            provider: key.provider,
            model: key.model || 'google/gemini-2.0-flash-lite:free',
            isCustomKey: true
          });
          succeeded = true;
          break;
        } 
        else if (key.provider === 'grok') {
          const fullText = await streamOpenAICompatible(
            'https://api.x.ai/v1/chat/completions',
            key.apiKey,
            key.model || 'grok-2-latest',
            {},
            messages,
            mode,
            sendEvent
          );

          recordKeySuccess(key.id);
          addSystemLog({
            level: 'success',
            category: 'execution',
            keyName: key.name,
            provider: key.provider,
            model: key.model || 'grok-2-latest',
            message: `✓ Success: ${key.name} (Grok) responded successfully. Saved as sticky key for next turn.`
          });
          const deployed = await autoDeployWebsiteFromText(fullText, sessionId);
          if (deployed.success) {
            const previewUrl = deployed.url || "/projects/index.html";
            sendEvent({ type: "action", action: `✓ Website generated & saved (${previewUrl})! Live Preview ready.` });
            sendEvent({ 
              type: "preview_ready", 
              url: previewUrl, 
              sessionId,
              html: deployed.html,
              timestamp: Date.now() 
            });
          }
          sendEvent({ 
            type: "done", 
            fullText, 
            activeKeyId: key.id,
            keyName: key.name,
            provider: key.provider,
            model: key.model || 'grok-2-latest',
            isCustomKey: true
          });
          succeeded = true;
          break;
        }
      } catch (err: any) {
        console.warn(`Error on key ${key.name} (${key.provider}):`, err.message || err);
        const is429 = err.status === 429 || err.message?.includes("429") || err.message?.toLowerCase().includes("quota") || err.message?.toLowerCase().includes("rate limit");
        const is503 = err.status === 503 || err.message?.includes("503") || err.message?.includes("high demand");
        const is404Model = err.status === 404 || err.message?.includes("not found") || err.message?.includes("not supported for generateContent");
        const isQuotaExceeded = is429 || err.message?.toLowerCase().includes("quota exceeded") || err.message?.toLowerCase().includes("resource_exhausted");
        const isAuthError = err.status === 401 || err.code === 401 || err.message?.includes("401") || err.message?.includes("API key not valid") || err.message?.includes("UNAUTHENTICATED") || err.message?.includes("User not found") || err.message?.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED");

        if (isAuthError) {
          addSystemLog({
            level: 'error',
            category: 'auth',
            keyName: key.name,
            provider: key.provider,
            model: key.model,
            message: `❌ ${key.name}: Invalid API Key (401 Unauthorized / Access Token Unsupported). Key disabled.`,
            details: err.message
          });
          key.isActive = false;
          loadSecrets().then((allSecrets) => {
            const existing = allSecrets.find(k => k.id === key.id);
            if (existing) {
              existing.isActive = false;
              existing.status = 'error';
              existing.lastError = 'Invalid API key format or unauthorized';
              saveSecrets(allSecrets).catch(() => {});
            }
          }).catch(() => {});
          recordKeyCooldown(key.id, 86400, "Invalid API key");
          sendEvent({
            type: "action",
            action: `❌ ${key.name}: Invalid API Key (Unauthorized). Key has been disabled.`
          });
        } else if ((is404Model || is503 || (isQuotaExceeded && key.model !== 'gemini-3.1-flash-lite')) && key.provider === 'gemini') {
          const oldModel = key.model;
          key.model = 'gemini-3.1-flash-lite';
          loadSecrets().then((allSecrets) => {
            const existing = allSecrets.find(k => k.id === key.id);
            if (existing) {
              existing.model = 'gemini-3.1-flash-lite';
              saveSecrets(allSecrets).catch(() => {});
            }
          }).catch(() => {});
          addSystemLog({
            level: 'warn',
            category: 'rotation',
            keyName: key.name,
            provider: key.provider,
            message: `⚡ Auto-healed ${key.name} from ${oldModel} to high-quota Gemini 3.1 Flash Lite (1,500 RPD).`
          });
          sendEvent({
            type: "action",
            action: `⚡ Auto-healed ${key.name} from ${oldModel} to high-quota Gemini 3.1 Flash Lite (1,500 RPD).`
          });
        }
        
        // Put key in short cooldown so next key in pool is tried
        if (!isAuthError) {
          addSystemLog({
            level: 'warn',
            category: isQuotaExceeded ? 'rate_limit' : 'execution',
            keyName: key.name,
            provider: key.provider,
            message: `⚠️ ${key.name} failed (${is429 ? 'Rate limit / 429' : err.message || 'Error'}). Rotating to next healthy key...`,
            details: err.message
          });
          recordKeyCooldown(key.id, isQuotaExceeded ? 60 : 15, err.message);
          sendEvent({
            type: "action",
            action: `⚠️ ${key.name} ${is429 ? 'hit rate limit (429)' : 'failed'}. Auto-rotating to next healthy API key...`
          });
          sendEvent({
            type: "key_cooldown",
            keyId: key.id,
            reason: is429 ? 'Rate limit exceeded' : err.message,
            cooldownSec: is429 ? 60 : 15
          });
        }
        // Continue loop to next key!
      }
    } else {
      addSystemLog({
        level: 'warn',
        category: 'rotation',
        message: 'পুল থেকে আর কোনো সক্রিয় ও প্রস্তুত সিক্রেট কী পাওয়া যায়নি।'
      });
      break;
    }
  }

  // Strict User Policy: Primary AI Studio engine is completely removed/disabled.
  // Responses MUST only come from user's secret keys.
  if (!succeeded) {
    addSystemLog({
      level: 'error',
      category: 'execution',
      message: 'পুলের সমস্ত সিক্রেট কী ব্যর্থ হয়েছে বা রেট লিমিটে পড়েছে। প্রাইমারি ইঞ্জিন বন্ধ রয়েছে।'
    });
    sendEvent({
      type: "error",
      error: "⚠️ আপনার যুক্ত করা সমস্ত সিক্রেট কী ব্যর্থ হয়েছে বা রেট লিমিটে পড়েছে। নেক্সাস এখন শুধুমাত্র আপনার সিক্রেট কী থেকে পরিচালিত হয় (প্রাইমারি ইঞ্জিন স্থায়ীভাবে বন্ধ রাখা হয়েছে)। অনুগ্রহ করে হ্যামবার্গার ড্রয়ার থেকে 'লগ' বা 🔑 মেনুতে গিয়ে কীগুলোর স্থিতি ও এরর মেসেজ পরীক্ষা করুন।",
      isAuthError: true
    });
  }

  res.end();
}
