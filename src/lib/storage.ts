import { tryParseJson } from './json';
import { cloneDefaults } from './settings/defaults';
import { migrateLegacy, readLegacySettings } from './settings/migrate';
import { normalizeSettings } from './settings/normalize';
import type { Settings } from './settings/types';

export const SETTINGS_KEY = 'lumen.settings.v2';
export const DESIGN_REVISION_KEY = 'lumen.design.revision';
const DESIGN_REVISION = 2;
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

function applyDesignRevision(settings: Settings): Settings {
  const widgets = settings.layout.widgets;
  const timeStage =
    widgets.greeting &&
    widgets.clock &&
    widgets.date &&
    widgets.search &&
    widgets.shortcuts;
  // Spotify now rides inside the search surface, so it no longer makes the
  // stage feel busy. Weather, focus, and notes still define the old layout.
  const classicExtras = widgets.weather && widgets.focus && widgets.notes;
  const quietStage = !widgets.weather && !widgets.focus && !widgets.notes;
  if (!timeStage || !(classicExtras || quietStage)) return settings;

  const appearance = settings.appearance;
  const untouchedAppearance =
    appearance.theme === 'dark' &&
    appearance.accent === '#7c9bff' &&
    appearance.vibe === 'aurora' &&
    appearance.wallpaper.kind === 'scene' &&
    appearance.wallpaper.scene === 'aurora-veil' &&
    appearance.wallpaperFit === 'cover' &&
    appearance.wallpaperDim === 34 &&
    appearance.wallpaperBlur === 0 &&
    appearance.wallpaperSaturation === 100 &&
    !appearance.timeShift &&
    appearance.effects.grain === 10 &&
    appearance.effects.vignette === 26 &&
    appearance.effects.glow === 30 &&
    appearance.effects.drift &&
    !appearance.effects.parallax &&
    appearance.glassIntensity === 52 &&
    appearance.radius === 20 &&
    appearance.density === 'comfortable' &&
    appearance.readabilityBoost &&
    appearance.motion === 'full';

  return {
    ...settings,
    appearance: untouchedAppearance ? cloneDefaults().appearance : settings.appearance,
    layout: {
      ...settings.layout,
      shortcutColumns: settings.layout.shortcutColumns === 4 ? 6 : settings.layout.shortcutColumns,
      widgets: {
        ...widgets,
        greeting: false,
        clock: false,
        date: false,
        search: true,
        shortcuts: true,
        weather: false,
        spotify: widgets.spotify,
        focus: false,
        notes: false,
      },
    },
    search: settings.search.autofocus
      ? { ...settings.search, autofocus: false }
      : settings.search,
  };
}

function hasLegacySpotifyToken(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(window.localStorage.getItem('lumen-spotify-token'));
  } catch {
    return false;
  }
}

function enableSearchSpotify(settings: Settings): Settings {
  if (settings.layout.widgets.spotify || !hasLegacySpotifyToken()) return settings;
  return {
    ...settings,
    layout: {
      ...settings.layout,
      widgets: { ...settings.layout.widgets, spotify: true },
    },
  };
}

async function readSettings(): Promise<{ settings: Settings; migrated: boolean }> {
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

export async function loadSettings(): Promise<{ settings: Settings; migrated: boolean }> {
  const loaded = await readSettings();
  let revision: unknown;
  try {
    revision = await storageGet(DESIGN_REVISION_KEY);
  } catch {
    revision = undefined;
  }
  if (revision === DESIGN_REVISION) return loaded;

  // Revision 2 only moves Spotify into the search bar. Do not re-run the
  // stage reset for people who already received revision 1.
  const settings =
    revision === 1
      ? enableSearchSpotify(loaded.settings)
      : applyDesignRevision(loaded.settings);
  try {
    if (settings !== loaded.settings) await saveSettings(settings);
    await storageSet(DESIGN_REVISION_KEY, DESIGN_REVISION);
  } catch {
    // A failed marker write only means this quiet migration may run again.
  }
  return { settings, migrated: loaded.migrated || settings !== loaded.settings };
}
