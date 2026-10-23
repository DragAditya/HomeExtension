import type { Settings, Shortcut } from './types';

export const DEFAULT_SHORTCUTS: Shortcut[] = [
  { id: 'default-gmail', name: 'Gmail', url: 'https://mail.google.com/' },
  { id: 'default-youtube', name: 'YouTube', url: 'https://youtube.com/' },
  { id: 'default-github', name: 'GitHub', url: 'https://github.com/' },
  { id: 'default-notion', name: 'Notion', url: 'https://notion.so/' },
  { id: 'default-chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/' },
  { id: 'default-x', name: 'X', url: 'https://x.com/' },
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
    vibe: 'aurora',
    wallpaper: { kind: 'scene', scene: 'aurora-veil' },
    wallpaperFit: 'cover',
    wallpaperDim: 34,
    wallpaperBlur: 0,
    wallpaperSaturation: 100,
    timeShift: false,
    effects: {
      grain: 10,
      vignette: 26,
      glow: 30,
      drift: true,
      parallax: false,
    },
    glassIntensity: 52,
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
    shortcutColumns: 4,
    widgets: {
      greeting: true,
      clock: true,
      date: true,
      search: true,
      shortcuts: true,
      weather: true,
      spotify: true,
      focus: true,
      notes: true,
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
    autofocus: true,
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
