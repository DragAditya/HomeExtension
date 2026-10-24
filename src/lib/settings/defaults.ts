import type { Settings, Shortcut } from './types';

export const DEFAULT_SHORTCUTS: Shortcut[] = [
  { id: 'default-chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/' },
  { id: 'default-claude', name: 'Claude', url: 'https://claude.ai/' },
  { id: 'default-github', name: 'GitHub', url: 'https://github.com/' },
  { id: 'default-gmail', name: 'Gmail', url: 'https://mail.google.com/' },
  { id: 'default-youtube', name: 'YouTube', url: 'https://youtube.com/' },
];

export const DEFAULT_SETTINGS: Settings = {
  schemaVersion: 2,
  onboarded: false,
  profile: {
    name: '',
  },
  appearance: {
    theme: 'dark',
    accent: '#7c9bff',
    vibe: 'deep-field',
    wallpaper: { kind: 'scene', scene: 'deep-field' },
    wallpaperFit: 'cover',
    wallpaperDim: 18,
    wallpaperBlur: 0,
    wallpaperSaturation: 112,
    timeShift: false,
    effects: {
      grain: 8,
      vignette: 22,
      glow: 20,
      drift: true,
      parallax: false,
    },
    glassIntensity: 46,
    radius: 20,
    density: 'comfortable',
    readabilityBoost: true,
    motion: 'full',
  },
  layout: {
    alignment: 'center',
    hour12: false,
    showSeconds: false,
    dateStyle: 'long',
    shortcutColumns: 6,
    widgets: {
      greeting: false,
      clock: false,
      date: false,
      search: true,
      shortcuts: true,
      weather: false,
      spotify: true,
      focus: false,
      notes: false,
    },
  },
  search: {
    engine: 'google',
    customEngine: {
      name: 'Custom',
      urlTemplate: 'https://www.google.com/search?q=%s',
    },
    suggestions: true,
    recentSearches: true,
    openInNewTab: false,
    autofocus: false,
  },
  shortcuts: DEFAULT_SHORTCUTS.map((shortcut) => ({ ...shortcut })),
  widgets: {
    weather: {
      city: '',
      latitude: null,
      longitude: null,
      units: 'auto',
      forecast: true,
    },
    focus: {
      workMinutes: 25,
      breakMinutes: 5,
      autoCycle: false,
      chime: true,
      sessionsToday: 0,
      lastSessionDate: '',
    },
    notes: {
      text: '',
    },
  },
  integrations: {
    spotifyClientId: '',
  },
  advanced: {
    overrides: {
      search: null,
      shortcuts: null,
      dock: null,
    },
  },
};

export function cloneDefaults(): Settings {
  return structuredClone(DEFAULT_SETTINGS);
}

export function cloneDefaultShortcuts(): Shortcut[] {
  return DEFAULT_SHORTCUTS.map((shortcut) => ({ ...shortcut }));
}
