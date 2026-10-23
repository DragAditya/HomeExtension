import { tryParseJson } from './json';
import { cloneDefaults } from './settings/defaults';
import { migrateLegacy, readLegacySettings } from './settings/migrate';
import { normalizeSettings } from './settings/normalize';
import type { Settings } from './settings/types';

export const SETTINGS_KEY = 'lumen.settings.v2';
export const RECOVERY_KEY = 'lumen.settings.recovery';
export const RECENT_SEARCHES_KEY = 'lumen.recentSearches';
export const SPOTIFY_TOKENS_KEY = 'lumen.spotify.tokens';
export const FOCUS_KEY = 'lumen.focus';

function hasChromeStorage(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    Boolean(chrome.storage?.local) &&
    typeof chrome.storage.local.get === 'function'
  );
}

function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export async function storageGet<T>(key: string): Promise<T | undefined> {
  if (hasChromeStorage()) {
    return new Promise<T | undefined>((resolve, reject) => {
      chrome.storage.local.get(key, (result) => {
        const error = chrome.runtime?.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }
        resolve(result?.[key] as T | undefined);
      });
    });
  }
  if (hasLocalStorage()) {
    const raw = window.localStorage.getItem(key);
    return raw ? (tryParseJson(raw) as T) : undefined;
  }
  return undefined;
}

export async function storageSet(key: string, value: unknown): Promise<void> {
  if (hasChromeStorage()) {
    return new Promise<void>((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        const error = chrome.runtime?.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }
        resolve();
      });
    });
  }
  if (hasLocalStorage()) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

export async function storageRemove(key: string): Promise<void> {
  if (hasChromeStorage()) {
    return new Promise<void>((resolve, reject) => {
      chrome.storage.local.remove(key, () => {
        const error = chrome.runtime?.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }
        resolve();
      });
    });
  }
  if (hasLocalStorage()) window.localStorage.removeItem(key);
}

export async function storageKeys(): Promise<string[]> {
  if (hasChromeStorage()) {
    return new Promise<string[]>((resolve, reject) => {
      chrome.storage.local.get(null, (result) => {
        const error = chrome.runtime?.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }
        resolve(Object.keys(result ?? {}));
      });
    });
  }
  if (hasLocalStorage()) return Object.keys(window.localStorage);
  return [];
}

export async function storageBytes(): Promise<number> {
  if (hasChromeStorage() && typeof chrome.storage.local.getBytesInUse === 'function') {
    return new Promise<number>((resolve) => {
      chrome.storage.local.getBytesInUse(null, (bytes) => resolve(bytes));
    });
  }
  if (hasLocalStorage()) {
    let total = 0;
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key) continue;
      total += key.length + (window.localStorage.getItem(key)?.length ?? 0);
    }
    return total;
  }
  return 0;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await storageSet(SETTINGS_KEY, settings);
}

let pendingSave: Settings | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function queueSave(settings: Settings): void {
  pendingSave = settings;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    void flushSettings();
  }, 150);
}

export async function flushSettings(): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  const snapshot = pendingSave;
  pendingSave = null;
  if (!snapshot) return;
  try {
    await saveSettings(snapshot);
  } catch (error) {
    console.error('Lumen: could not save settings', error);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    void flushSettings();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flushSettings();
  });
}

export async function loadSettings(): Promise<{ settings: Settings; migrated: boolean }> {
  let stored: unknown;
  try {
    stored = await storageGet<unknown>(SETTINGS_KEY);
  } catch {
    stored = undefined;
  }

  if (stored !== undefined && stored !== null) {
    if (typeof stored === 'string') {
      const parsed = tryParseJson(stored);
      if (!parsed) {
        try {
          await storageSet(RECOVERY_KEY, stored);
        } catch {
          // A corrupt value should never prevent the new tab from opening.
        }
        return { settings: cloneDefaults(), migrated: false };
      }
      stored = parsed;
    }
    return { settings: normalizeSettings(stored), migrated: false };
  }

  const legacy = readLegacySettings();
  if (legacy) {
    const migrated = migrateLegacy(legacy.settings, legacy.shortcuts, legacy.clientId);
    if (migrated) {
      try {
        await saveSettings(migrated);
      } catch {
        // Keep the in-memory migration even if the first write fails.
      }
      return { settings: migrated, migrated: true };
    }
  }

  return { settings: cloneDefaults(), migrated: false };
}
