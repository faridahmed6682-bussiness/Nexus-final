import { ApiKeyItem, SettingsConfig, ProviderType } from '../types/secrets';

const STORAGE_KEYS = 'nexus_api_keys';
const STORAGE_SETTINGS = 'nexus_settings';

export const DEFAULT_SETTINGS: SettingsConfig = {
  autoFailover: true,
  safePacing: true,
  minRequestIntervalMs: 1500,
  preferredProvider: 'all',
};

export function getLocalKeys(): ApiKeyItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS);
    if (!raw) return [];
    const keys: ApiKeyItem[] = JSON.parse(raw);
    let modified = false;
    // Filter out obsolete/dummy keys from previous zip files
    const validKeys = keys.filter(k => {
      const isBogus = (k.apiKey || '').startsWith('AQ.') || (k.apiKey || '').startsWith('sk-or-v1-b600f02324');
      if (isBogus) modified = true;
      return !isBogus;
    });
    for (const k of validKeys) {
      if (k.provider === 'gemini') {
        const lower = (k.model || '').toLowerCase();
        if (lower.includes('3.8') || lower.includes('flash-latest') || lower.includes('1.5') || lower.includes('2.0') || lower.includes('2.5') || !k.model) {
          k.model = 'gemini-3.1-flash-lite';
          modified = true;
        }
      }
    }
    if (modified) {
      localStorage.setItem(STORAGE_KEYS, JSON.stringify(validKeys));
    }
    return validKeys;
  } catch {
    return [];
  }
}

export function saveLocalKeys(keys: ApiKeyItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS, JSON.stringify(keys));
    // Also sync to server in background
    fetch('/api/secrets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys }),
    }).catch(err => console.warn("Failed to sync secrets to server:", err));
  } catch (err) {
    console.warn("Failed to save local keys:", err);
  }
}

export function getSettings(): SettingsConfig {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: SettingsConfig): void {
  try {
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.warn("Failed to save settings:", err);
  }
}

export async function testKeyRemote(
  provider: ProviderType, 
  apiKey: string, 
  model?: string
): Promise<{ success: boolean; latencyMs: number; message?: string }> {
  try {
    const res = await fetch('/api/secrets/test-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey, model }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, latencyMs: 0, message: err.message || 'Network request failed' };
  }
}
