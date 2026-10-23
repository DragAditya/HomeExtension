import { create } from 'zustand';
import { VIBES } from '../lib/vibes';
import { queueSave } from '../lib/storage';
import { cloneDefaultShortcuts, cloneDefaults } from '../lib/settings/defaults';
import { getValue, setValue } from '../lib/settings/paths';
import {
  SETTINGS_REGISTRY,
  getSettingMeta,
  settingsForSection,
} from '../lib/settings/registry';
import type { Settings, SettingsSectionId, Shortcut, VibeId } from '../lib/settings/types';

const VIBE_PATHS = new Set([
  'appearance.theme',
  'appearance.accent',
  'appearance.wallpaper',
  'appearance.wallpaperDim',
  'appearance.wallpaperSaturation',
  'appearance.effects.grain',
  'appearance.effects.vignette',
  'appearance.effects.glow',
  'appearance.effects.drift',
]);

type SettingsState = {
  settings: Settings;
  hydrated: boolean;
  migrated: boolean;
  hydrateWith: (settings: Settings, migrated: boolean) => void;
  set: (path: string, value: unknown) => void;
  setMany: (updates: Array<[string, unknown]>) => void;
  applyVibe: (vibe: VibeId) => void;
  reset: (path: string) => void;
  resetSection: (section: SettingsSectionId) => void;
  resetAll: () => void;
  replace: (settings: Settings) => void;
  setShortcuts: (shortcuts: Shortcut[]) => void;
};

function withVibeMarker(settings: Settings, updates: Array<[string, unknown]>): Settings {
  const hasVibe = updates.some(([path]) => path === 'appearance.vibe');
  const touchesVibe = updates.some(([path]) => VIBE_PATHS.has(path));
  let next = settings;
  for (const [path, value] of updates) {
    next = setValue(next, path, value);
  }
  if (touchesVibe && !hasVibe) {
    next = setValue(next, 'appearance.vibe', 'custom');
  }
  return next;
}

export const useSettings = create<SettingsState>((set, get) => ({
  settings: cloneDefaults(),
  hydrated: false,
  migrated: false,

  hydrateWith: (settings, migrated) => {
    set({ settings, hydrated: true, migrated });
  },

  set: (path, value) => {
    const current = get().settings;
    set({ settings: withVibeMarker(current, [[path, value]]) });
  },

  setMany: (updates) => {
    const current = get().settings;
    set({ settings: withVibeMarker(current, updates) });
  },

  applyVibe: (vibeId) => {
    const vibe = VIBES[vibeId];
    const updates: Array<[string, unknown]> = [
      ['appearance.theme', vibe.theme],
      ['appearance.accent', vibe.accent],
      ['appearance.wallpaper', { kind: 'scene', scene: vibe.scene }],
      ['appearance.wallpaperDim', vibe.wallpaperDim],
      ['appearance.wallpaperSaturation', vibe.wallpaperSaturation],
      ['appearance.effects.grain', vibe.effects.grain],
      ['appearance.effects.vignette', vibe.effects.vignette],
      ['appearance.effects.glow', vibe.effects.glow],
      ['appearance.effects.drift', vibe.effects.drift],
      ['appearance.vibe', vibeId],
    ];
    set({ settings: withVibeMarker(get().settings, updates) });
  },

  reset: (path) => {
    const meta = getSettingMeta(path);
    if (!meta) return;
    set({ settings: withVibeMarker(get().settings, [[path, meta.defaultValue]]) });
  },

  resetSection: (section) => {
    let next = get().settings;
    if (section === 'shortcuts') {
      next = setValue(next, 'shortcuts', cloneDefaultShortcuts());
    } else {
      for (const meta of settingsForSection(section)) {
        next = setValue(next, meta.path, meta.defaultValue);
      }
      if (section === 'appearance') {
        next = setValue(next, 'appearance.vibe', cloneDefaults().appearance.vibe);
        next = setValue(
          next,
          'appearance.wallpaper',
          structuredClone(cloneDefaults().appearance.wallpaper),
        );
      }
      if (section === 'search') {
        next = setValue(next, 'search.customEngine', {
          ...cloneDefaults().search.customEngine,
        });
      }
    }
    set({ settings: next });
  },

  resetAll: () => {
    set({ settings: cloneDefaults() });
  },

  replace: (settings) => {
    set({ settings });
  },

  setShortcuts: (shortcuts) => {
    set({ settings: setValue(get().settings, 'shortcuts', shortcuts) });
  },
}));

useSettings.subscribe((state, previous) => {
  if (state.hydrated && state.settings !== previous.settings) {
    queueSave(state.settings);
  }
});

export function readSetting<T>(path: string): T {
  return getValue(useSettings.getState().settings, path) as T;
}

export function allSettingsPaths(): string[] {
  return SETTINGS_REGISTRY.map((entry) => entry.path);
}
