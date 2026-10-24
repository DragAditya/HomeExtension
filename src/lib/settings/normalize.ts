import { SCENES, inferVibe, isVibeId } from '../vibes';
import { DEFAULT_SETTINGS } from './defaults';
import { getValue, isPlainObject, setValue } from './paths';
import { SETTINGS_REGISTRY, type SettingMeta } from './registry';
import type {
  SceneId,
  Settings,
  Shortcut,
  WallpaperSource,
} from './types';

export const MAX_SHORTCUTS = 16;
export const MAX_NOTE_LENGTH = 50_000;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeHex(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const raw = value.trim();
  const short = /^#([0-9a-f]{3})$/i.exec(raw);
  if (short) {
    return `#${short[1]
      .split('')
      .map((character) => character + character)
      .join('')
      .toLowerCase()}`;
  }
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
  return fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1' || value === 'true') return true;
  if (value === 0 || value === '0' || value === 'false') return false;
  return fallback;
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asText(value: unknown, fallback: string, maxLength = 200): string {
  if (typeof value !== 'string') return fallback;
  return value.slice(0, maxLength);
}

function normalizeByMeta(meta: SettingMeta, raw: unknown): unknown {
  const fallback = meta.defaultValue;
  switch (meta.kind) {
    case 'toggle':
      return asBoolean(raw, Boolean(fallback));
    case 'slider': {
      const min = meta.min ?? 0;
      const max = meta.max ?? 100;
      const step = meta.step ?? 1;
      const numeric = clamp(asNumber(raw, Number(fallback)), min, max);
      return Math.round(numeric / step) * step;
    }
    case 'override': {
      if (raw === null || raw === undefined) return null;
      return Math.round(clamp(asNumber(raw, 0), 0, 100));
    }
    case 'color':
      return normalizeHex(raw, String(fallback));
    case 'select':
    case 'segmented': {
      const options = meta.options ?? [];
      const match = options.find((option) => String(option.value) === String(raw));
      return match ? match.value : fallback;
    }
    case 'text': {
      if (typeof raw !== 'string') return fallback;
      let text = raw.slice(0, meta.maxLength ?? 500);
      if (meta.validate === 'name') text = text.trim().slice(0, 40);
      if (meta.validate === 'client-id') text = text.trim().slice(0, 128);
      return text;
    }
    default:
      return fallback;
  }
}

export function normalizeUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  let raw = value.trim();
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = `https://${raw}`;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function normalizeShortcut(value: unknown): Shortcut | null {
  if (!isPlainObject(value)) return null;
  const name = asText(value.name, '', 40).trim();
  const url = normalizeUrl(value.url);
  if (!name || !url) return null;
  const id =
    typeof value.id === 'string' && value.id.trim()
      ? value.id.trim().slice(0, 64)
      : `shortcut-${Math.random().toString(36).slice(2, 10)}`;
  const icon =
    typeof value.icon === 'string' && /^https?:\/\//i.test(value.icon.trim())
      ? value.icon.trim().slice(0, 2048)
      : undefined;
  return { id, name, url, ...(icon ? { icon } : {}) };
}

export function normalizeShortcuts(value: unknown): Shortcut[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const shortcuts: Shortcut[] = [];
  for (const entry of value) {
    const shortcut = normalizeShortcut(entry);
    if (!shortcut) continue;
    if (seen.has(shortcut.id)) {
      shortcut.id = `shortcut-${Math.random().toString(36).slice(2, 10)}`;
    }
    seen.add(shortcut.id);
    shortcuts.push(shortcut);
    if (shortcuts.length >= MAX_SHORTCUTS) break;
  }
  return shortcuts;
}

const SCENE_IDS = new Set<string>(SCENES.map((scene) => scene.id));

export function normalizeWallpaper(value: unknown): WallpaperSource {
  if (!isPlainObject(value)) return { kind: 'scene', scene: 'deep-field' };
  if (value.kind === 'scene') {
    const scene = typeof value.scene === 'string' && SCENE_IDS.has(value.scene)
      ? (value.scene as SceneId)
      : 'deep-field';
    return { kind: 'scene', scene };
  }
  if (value.kind === 'image' || value.kind === 'video') {
    const id = typeof value.id === 'string' && value.id ? value.id : undefined;
    const rawUrl = typeof value.url === 'string' ? value.url : '';
    const url =
      /^https?:\/\//i.test(rawUrl) && rawUrl.length <= 4096 ? rawUrl : '';
    if (id) return { kind: value.kind, url, id };
    if (url) return { kind: value.kind, url };
    return { kind: 'scene', scene: 'deep-field' };
  }
  return { kind: 'scene', scene: 'deep-field' };
}

export function isValidTemplate(value: string): boolean {
  if (!value.includes('%s')) return false;
  try {
    const sample = value.replace('%s', 'lumen');
    const parsed = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(sample) ? sample : `https://${sample}`);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function normalizeSettings(input: unknown): Settings {
  let result = structuredClone(DEFAULT_SETTINGS);
  if (!isPlainObject(input)) return result;

  result.onboarded = asBoolean(input.onboarded, result.onboarded);

  for (const meta of SETTINGS_REGISTRY) {
    const raw = getValue(input, meta.path);
    if (raw === undefined) continue;
    result = setValue(result, meta.path, normalizeByMeta(meta, raw));
  }

  const rawAppearance = input.appearance as Record<string, unknown> | undefined;
  const rawVibe = rawAppearance?.vibe;

  result.appearance.wallpaper = normalizeWallpaper(rawAppearance?.wallpaper);

  if (!isValidTemplate(result.search.customEngine.urlTemplate)) {
    result.search.customEngine.urlTemplate = DEFAULT_SETTINGS.search.customEngine.urlTemplate;
    if (result.search.engine === 'custom') result.search.engine = 'google';
  }

  const rawShortcuts = input.shortcuts;
  result.shortcuts = normalizeShortcuts(
    Array.isArray(rawShortcuts) ? rawShortcuts : DEFAULT_SETTINGS.shortcuts,
  );

  const weather = isPlainObject(input.widgets)
    ? (input.widgets.weather as Record<string, unknown> | undefined)
    : undefined;
  if (weather) {
    result.widgets.weather.latitude =
      typeof weather.latitude === 'number' && Number.isFinite(weather.latitude)
        ? clamp(weather.latitude, -90, 90)
        : null;
    result.widgets.weather.longitude =
      typeof weather.longitude === 'number' && Number.isFinite(weather.longitude)
        ? clamp(weather.longitude, -180, 180)
        : null;
    if (!result.widgets.weather.city.trim()) {
      result.widgets.weather.latitude = null;
      result.widgets.weather.longitude = null;
    }
  }

  const focus = isPlainObject(input.widgets)
    ? (input.widgets.focus as Record<string, unknown> | undefined)
    : undefined;
  if (focus) {
    result.widgets.focus.sessionsToday = Math.round(
      clamp(asNumber(focus.sessionsToday, 0), 0, 99),
    );
    result.widgets.focus.lastSessionDate =
      typeof focus.lastSessionDate === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(focus.lastSessionDate)
        ? focus.lastSessionDate
        : '';
  }

  const notes = isPlainObject(input.widgets)
    ? (input.widgets.notes as Record<string, unknown> | undefined)
    : undefined;
  if (notes && typeof notes.text === 'string') {
    result.widgets.notes.text = notes.text.slice(0, MAX_NOTE_LENGTH);
  }

  if (isVibeId(rawVibe)) {
    result.appearance.vibe = rawVibe;
  } else if (rawVibe === 'custom') {
    result.appearance.vibe = 'custom';
  } else {
    result.appearance.vibe = inferVibe(result);
  }

  return result;
}

export function sameSettings(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
