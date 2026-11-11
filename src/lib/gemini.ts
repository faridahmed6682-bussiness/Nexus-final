/**
 * Client-side Gemini Chat Interface
 * Communicates with the server-side Gemini streaming endpoint.
 * Zero client-side API key dependency; fully secured and working for all visitors.
 */

import { getLocalKeys, getSettings } from './secretsManager';

export interface KeyMetadata {
  keyId?: string;
  keyName: string;
  provider: string;
  model: string;
  isCustomKey: boolean;
}

export async function chatWithAI(
  messages: any[], 
  onUpdate: (text: string, imageUrl?: string) => void, 
  onAction?: (action: string) => void, 
  mode: string = 'general',
  onKeyCooldown?: (keyId: string, cooldownSec: number) => void,
  onPreviewReady?: (url: string, html?: string, sessionId?: string) => void,
  sessionId?: string,
  onKeyInfo?: (info: KeyMetadata) => void
) {
  const userKeys = getLocalKeys();
  const settings = getSettings();

  const response = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      messages, 
      mode, 
      userKeys, 
      preferredProvider: settings.preferredProvider,
      safePacing: settings.safePacing,
      sessionId
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) {
      throw new Error("429: Quota exceeded. Please wait a moment and try clearing the chat.");
    }
    throw new Error(errorText || `Server error (${response.status})`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("Failed to initialize server stream.");

  const decoder = new TextDecoder();
  let buffer = '';
  let latestText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;

        try {
          const event = JSON.parse(jsonStr);

          if (event.type === 'text') {
            latestText = event.text;
            onUpdate(latestText);
          } else if (event.type === 'action' && onAction) {
            onAction(event.action);
          } else if (event.type === 'image') {
            onUpdate(latestText, event.imageUrl);
          } else if (event.type === 'preview_ready' && onPreviewReady) {
            onPreviewReady(event.url, event.html, event.sessionId);
          } else if (event.type === 'key_active' && onKeyInfo) {
            onKeyInfo({
              keyId: event.keyId,
              keyName: event.keyName || 'API Key',
              provider: event.provider || 'gemini',
              model: event.model || 'gemini-3.1-flash-lite',
              isCustomKey: !!event.isCustomKey
            });
          } else if (event.type === 'done' && onKeyInfo && event.keyName) {
            onKeyInfo({
              keyId: event.activeKeyId || event.keyId,
              keyName: event.keyName,
              provider: event.provider || 'gemini',
              model: event.model || 'gemini-3.1-flash-lite',
              isCustomKey: !!event.isCustomKey
            });
          } else if (event.type === 'key_cooldown' && onKeyCooldown) {
            onKeyCooldown(event.keyId, event.cooldownSec);
          } else if (event.type === 'error') {
            if (event.is429) {
              throw new Error("429: Quota exceeded. Please wait a moment and try clearing the chat.");
            }
            throw new Error(event.error || "An error occurred with Gemini.");
          }
        } catch (e: any) {
          if (e.message?.includes('429')) throw e;
          console.warn("Stream line parse error:", e);
        }
      }
    }
  }
}
