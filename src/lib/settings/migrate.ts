import { tryParseJson } from '../json';
import { clamp, normalizeSettings } from './normalize';
import { isPlainObject } from './paths';
import type { SearchEngineId, Settings } from './types';

type Legacy = Record<string, unknown>;

const BASE = {
  searchBlur: 24,
  searchOpacity: 46,
  searchBorder: 25,
  searchGlow: 22,
  searchTint: 12,
  shortcutOpacity: 40,
  shortcutBlur: 18,
  shortcutBorder: 20,
  shortcutGlow: 14,
};

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function pickChanged(legacy: Legacy, keys: Array<keyof typeof BASE>): boolean {
  return keys.some(
    (key) => typeof legacy[key] === 'number' && Math.abs(num(legacy[key]) - BASE[key]) > 0.5,
  );
}

function intensityFrom(legacy: Legacy, mode: 'search' | 'shortcuts'): number {
  if (mode === 'search') {
    const values = [
      clamp((num(legacy.searchBlur, BASE.searchBlur) / 32) * 100, 0, 100),
      clamp(num(legacy.searchOpacity, BASE.searchOpacity), 0, 100),
      clamp(num(legacy.searchBorder, BASE.searchBorder), 0, 100),
      clamp(num(legacy.searchGlow, BASE.searchGlow), 0, 100),
      clamp(num(legacy.searchTint, BASE.searchTint), 0, 100),
    ];
    return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
  }
  const values = [
    clamp(num(legacy.shortcutOpacity, BASE.shortcutOpacity), 0, 100),
    clamp((num(legacy.shortcutBlur, BASE.shortcutBlur) / 32) * 100, 0, 100),
    clamp(num(legacy.shortcutBorder, BASE.shortcutBorder), 0, 100),
    clamp(num(legacy.shortcutGlow, BASE.shortcutGlow), 0, 100),
  ];
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function legacyEngine(value: unknown): SearchEngineId {
  const engine = typeof value === 'string' ? value.toLowerCase() : '';
  if (engine === 'bing') return 'bing';
  if (engine === 'duckduckgo' || engine === 'duck duck go') return 'duckduckgo';
  if (engine === 'youtube') return 'youtube';
  if (engine === 'custom') return 'custom';
  return 'google';
}

export function migrateLegacy(
  legacySettings: unknown,
  legacyShortcuts: unknown,
  legacyClientId?: unknown,
): Settings | null {
  const legacy = isPlainObject(legacySettings) ? (legacySettings as Legacy) : null;
  const hasShortcuts = Array.isArray(legacyShortcuts) && legacyShortcuts.length > 0;
  const hasClientId = typeof legacyClientId === 'string' && legacyClientId.trim().length > 0;
  if (!legacy && !hasShortcuts && !hasClientId) return null;

  const partial: Record<string, unknown> = {
    onboarded: true,
  };

  if (legacy) {
    const appearance: Record<string, unknown> = {};
    const layout: Record<string, unknown> = { widgets: {} };
    const search: Record<string, unknown> = {};
    const advanced: Record<string, unknown> = { overrides: {} };

    if (legacy.theme === 'light' || legacy.theme === 'dark') {
      appearance.theme = legacy.theme;
    }
    if (typeof legacy.accent === 'string' && /^#[0-9a-f]{3,6}$/i.test(legacy.accent.trim())) {
      appearance.accent = legacy.accent.trim();
    }
    if (typeof legacy.blur === 'number') {
      appearance.glassIntensity = Math.round(clamp((legacy.blur / 30) * 100, 0, 100));
    }
    appearance.effects = {
      glow: legacy.glow === false ? 0 : 60,
    };

    const background = isPlainObject(legacy.background)
      ? (legacy.background as Legacy)
      : null;
    if (background) {
      const type = background.type;
      const rawUrl = typeof background.url === 'string' ? background.url : '';
      if ((type === 'image' || type === 'video') && /^https?:\/\//i.test(rawUrl)) {
        appearance.wallpaper = { kind: type, url: rawUrl };
      }
      if (background.fit === 'cover' || background.fit === 'contain') {
        appearance.wallpaperFit = background.fit;
      }
      if (typeof background.dim === 'number') {
        appearance.wallpaperDim = Math.round(clamp(background.dim, 0, 80));
      }
    }

    if (typeof legacy.searchRadius === 'number' && legacy.searchRadius !== 34) {
      appearance.radius = Math.round(clamp(legacy.searchRadius, 8, 32));
    }

    if (typeof legacy.showClock === 'boolean') {
      (layout.widgets as Record<string, unknown>).clock = legacy.showClock;
    }
    if (typeof legacy.showGreeting === 'boolean') {
      (layout.widgets as Record<string, unknown>).greeting = legacy.showGreeting;
    }
    if (typeof legacy.showDate === 'boolean') {
      (layout.widgets as Record<string, unknown>).date = legacy.showDate;
    }

    search.engine = legacyEngine(legacy.engine);
    if (typeof legacy.suggestions === 'boolean') search.suggestions = legacy.suggestions;
    if (typeof legacy.newTab === 'boolean') search.openInNewTab = legacy.newTab;

    if (typeof legacy.spotifyClientId === 'string') {
      partial.integrations = { spotifyClientId: legacy.spotifyClientId };
    }

    if (pickChanged(legacy, ['searchBlur', 'searchOpacity', 'searchBorder', 'searchGlow', 'searchTint'])) {
      (advanced.overrides as Record<string, unknown>).search = intensityFrom(legacy, 'search');
    }
    if (
      pickChanged(legacy, ['shortcutOpacity', 'shortcutBlur', 'shortcutBorder', 'shortcutGlow'])
    ) {
      (advanced.overrides as Record<string, unknown>).shortcuts = intensityFrom(
        legacy,
        'shortcuts',
      );
    }

    partial.appearance = appearance;
    partial.layout = layout;
    partial.search = search;
    partial.advanced = advanced;
  }

  if (hasShortcuts) {
    partial.shortcuts = legacyShortcuts;
  }
  if (hasClientId) {
    partial.integrations = {
      ...(isPlainObject(partial.integrations) ? partial.integrations : {}),
      spotifyClientId: String(legacyClientId).trim(),
    };
  }

  return normalizeSettings(partial);
}

export function readLegacySettings(): {
  settings: unknown;
  shortcuts: unknown;
  clientId: unknown;
} | null {
  if (typeof window === 'undefined') return null;
  try {
    const settingsRaw = window.localStorage.getItem('lumen-settings');
    const shortcutsRaw = window.localStorage.getItem('lumen-shortcuts');
    const clientIdRaw = window.localStorage.getItem('lumen-spotify-client-id');
    const settings = settingsRaw ? tryParseJson(settingsRaw) : null;
    const shortcuts = shortcutsRaw ? tryParseJson(shortcutsRaw) : null;
    if (!settings && !shortcuts && !clientIdRaw) return null;
    return { settings, shortcuts, clientId: clientIdRaw };
  } catch {
    return null;
  }
}
