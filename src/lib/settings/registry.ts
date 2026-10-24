import { DEFAULT_SETTINGS } from './defaults';
import { getValue } from './paths';
import type { SettingsSectionId } from './types';

export type ControlKind =
  | 'toggle'
  | 'slider'
  | 'select'
  | 'segmented'
  | 'text'
  | 'color'
  | 'override';

export type Option = { value: string | number; label: string };

export type SettingMeta = {
  path: string;
  section: SettingsSectionId;
  label: string;
  help?: string;
  kind: ControlKind;
  defaultValue: unknown;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: Option[];
  placeholder?: string;
  maxLength?: number;
  validate?: 'url-template' | 'client-id' | 'name';
  advanced?: boolean;
  keywords?: string[];
};

export const SECTION_META: Record<
  SettingsSectionId,
  { label: string; description: string; icon: string }
> = {
  appearance: {
    label: 'Appearance',
    description: 'Theme, wallpaper, glass, and motion.',
    icon: 'sparkles',
  },
  layout: {
    label: 'Layout',
    description: 'What sits on the stage and where.',
    icon: 'layout',
  },
  search: {
    label: 'Search',
    description: 'Engine, suggestions, and behavior.',
    icon: 'search',
  },
  shortcuts: {
    label: 'Shortcuts',
    description: 'The tiles below the search bar.',
    icon: 'grid',
  },
  widgets: {
    label: 'Widgets',
    description: 'Weather, focus, and notes.',
    icon: 'blocks',
  },
  integrations: {
    label: 'Integrations',
    description: 'Connect Spotify.',
    icon: 'plug',
  },
  data: {
    label: 'Data & privacy',
    description: 'Backup, reset, and storage.',
    icon: 'database',
  },
  about: {
    label: 'About',
    description: 'Version, keys, and licenses.',
    icon: 'info',
  },
};

const meta = (entry: Omit<SettingMeta, 'defaultValue'>): SettingMeta => ({
  ...entry,
  defaultValue: getValue(DEFAULT_SETTINGS, entry.path),
});

export const SETTINGS_REGISTRY: SettingMeta[] = [
  // Appearance
  meta({
    path: 'appearance.theme',
    section: 'appearance',
    label: 'Theme',
    help: 'System follows your operating system appearance.',
    kind: 'segmented',
    options: [
      { value: 'dark', label: 'Dark' },
      { value: 'light', label: 'Light' },
      { value: 'system', label: 'System' },
    ],
    keywords: ['dark', 'light', 'system', 'appearance'],
  }),
  meta({
    path: 'appearance.accent',
    section: 'appearance',
    label: 'Accent',
    help: 'Used for focus rings, links, and active states.',
    kind: 'color',
    keywords: ['colour', 'brand', 'tint'],
  }),
  meta({
    path: 'appearance.wallpaperFit',
    section: 'appearance',
    label: 'Wallpaper fit',
    help: 'How a custom image or video fills the window.',
    kind: 'segmented',
    options: [
      { value: 'cover', label: 'Cover' },
      { value: 'contain', label: 'Contain' },
    ],
    keywords: ['crop', 'fit', 'image', 'video'],
  }),
  meta({
    path: 'appearance.wallpaperDim',
    section: 'appearance',
    label: 'Dim',
    help: 'Darkens the wallpaper behind the stage.',
    kind: 'slider',
    min: 0,
    max: 80,
    step: 1,
    unit: '%',
    keywords: ['dark', 'brightness', 'scrim'],
  }),
  meta({
    path: 'appearance.wallpaperBlur',
    section: 'appearance',
    label: 'Wallpaper blur',
    help: 'Softens a custom image or video. Presets are already soft.',
    kind: 'slider',
    min: 0,
    max: 40,
    step: 1,
    unit: 'px',
    keywords: ['soft', 'defocus'],
  }),
  meta({
    path: 'appearance.wallpaperSaturation',
    section: 'appearance',
    label: 'Saturation',
    help: 'Pushes the scene toward grey or vivid.',
    kind: 'slider',
    min: 40,
    max: 150,
    step: 1,
    unit: '%',
    keywords: ['color', 'colour', 'vivid', 'muted'],
  }),
  meta({
    path: 'appearance.timeShift',
    section: 'appearance',
    label: 'Time-of-day shift',
    help: 'Warms and cools the wallpaper through the day.',
    kind: 'toggle',
    keywords: ['day', 'night', 'dawn', 'dusk', 'automatic'],
  }),
  meta({
    path: 'appearance.effects.grain',
    section: 'appearance',
    label: 'Film grain',
    help: 'A fine noise layer that keeps gradients from banding.',
    kind: 'slider',
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
    keywords: ['noise', 'texture'],
  }),
  meta({
    path: 'appearance.effects.vignette',
    section: 'appearance',
    label: 'Vignette',
    help: 'Darkens the edges to focus the center.',
    kind: 'slider',
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
    keywords: ['edge', 'shade'],
  }),
  meta({
    path: 'appearance.effects.glow',
    section: 'appearance',
    label: 'Accent glow',
    help: 'The halo around the search bar and active controls.',
    kind: 'slider',
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
    keywords: ['light', 'halo', 'luminous'],
  }),
  meta({
    path: 'appearance.effects.drift',
    section: 'appearance',
    label: 'Slow drift',
    help: 'The wallpaper breathes. Disabled automatically for reduced motion.',
    kind: 'toggle',
    keywords: ['animation', 'aurora', 'movement'],
  }),
  meta({
    path: 'appearance.effects.parallax',
    section: 'appearance',
    label: 'Cursor parallax',
    help: 'A very small wallpaper shift that follows the pointer.',
    kind: 'toggle',
    keywords: ['mouse', 'movement', 'depth'],
  }),
  meta({
    path: 'appearance.glassIntensity',
    section: 'appearance',
    label: 'Glass intensity',
    help: 'One material control: blur, fill, border, and shadow move together.',
    kind: 'slider',
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
    keywords: ['blur', 'frost', 'opacity', 'material'],
  }),
  meta({
    path: 'appearance.radius',
    section: 'appearance',
    label: 'Corner radius',
    help: 'Shared by tiles, dock, panels, and controls.',
    kind: 'slider',
    min: 8,
    max: 32,
    step: 1,
    unit: 'px',
    keywords: ['round', 'corners', 'shape'],
  }),
  meta({
    path: 'appearance.density',
    section: 'appearance',
    label: 'Density',
    help: 'Compact tightens vertical spacing without shrinking type.',
    kind: 'segmented',
    options: [
      { value: 'comfortable', label: 'Comfortable' },
      { value: 'compact', label: 'Compact' },
    ],
    keywords: ['spacing', 'size'],
  }),
  meta({
    path: 'appearance.readabilityBoost',
    section: 'appearance',
    label: 'Readability boost',
    help: 'Stronger glass and text shadows for busy custom wallpapers.',
    kind: 'toggle',
    keywords: ['contrast', 'accessible', 'legible'],
  }),
  meta({
    path: 'appearance.motion',
    section: 'appearance',
    label: 'Motion',
    help: 'Reduced removes drift, parallax, and decorative entrances.',
    kind: 'segmented',
    options: [
      { value: 'full', label: 'Full' },
      { value: 'reduced', label: 'Reduced' },
    ],
    keywords: ['animation', 'accessibility', 'reduce'],
  }),
  meta({
    path: 'advanced.overrides.search',
    section: 'appearance',
    label: 'Search surface',
    help: 'Override the global glass intensity for search only.',
    kind: 'override',
    advanced: true,
    keywords: ['advanced', 'blur', 'opacity', 'search'],
  }),
  meta({
    path: 'advanced.overrides.shortcuts',
    section: 'appearance',
    label: 'Shortcut surface',
    help: 'Override the global glass intensity for shortcut tiles only.',
    kind: 'override',
    advanced: true,
    keywords: ['advanced', 'blur', 'opacity', 'tiles'],
  }),
  meta({
    path: 'advanced.overrides.dock',
    section: 'appearance',
    label: 'Dock surface',
    help: 'Override the global glass intensity for the bottom dock only.',
    kind: 'override',
    advanced: true,
    keywords: ['advanced', 'blur', 'opacity', 'player'],
  }),

  // Layout
  meta({
    path: 'layout.alignment',
    section: 'layout',
    label: 'Stage alignment',
    help: 'Center is the classic stage. Left is an editorial layout.',
    kind: 'segmented',
    options: [
      { value: 'center', label: 'Center' },
      { value: 'left', label: 'Left' },
    ],
    keywords: ['position', 'center', 'left'],
  }),
  meta({
    path: 'profile.name',
    section: 'layout',
    label: 'Your name',
    help: 'Used only in the greeting. Leave blank for a generic hello.',
    kind: 'text',
    placeholder: 'Alex',
    maxLength: 40,
    validate: 'name',
    keywords: ['greeting', 'name', 'hello'],
  }),
  meta({
    path: 'layout.hour12',
    section: 'layout',
    label: '12-hour clock',
    help: 'Off uses 24-hour time.',
    kind: 'toggle',
    keywords: ['time', 'am', 'pm'],
  }),
  meta({
    path: 'layout.showSeconds',
    section: 'layout',
    label: 'Show seconds',
    kind: 'toggle',
    keywords: ['time', 'clock'],
  }),
  meta({
    path: 'layout.dateStyle',
    section: 'layout',
    label: 'Date style',
    kind: 'segmented',
    options: [
      { value: 'short', label: 'Short' },
      { value: 'long', label: 'Long' },
    ],
    keywords: ['date', 'calendar'],
  }),
  meta({
    path: 'layout.shortcutColumns',
    section: 'layout',
    label: 'Shortcut columns',
    help: 'The row caps at this many tiles on wide screens.',
    kind: 'segmented',
    options: [
      { value: 4, label: '4' },
      { value: 6, label: '6' },
      { value: 8, label: '8' },
    ],
    keywords: ['grid', 'tiles', 'columns'],
  }),
  ...(
    [
      ['greeting', 'Greeting'],
      ['clock', 'Clock'],
      ['date', 'Date'],
      ['search', 'Search'],
      ['shortcuts', 'Shortcuts'],
      ['weather', 'Weather'],
      ['spotify', 'Spotify'],
      ['focus', 'Focus'],
      ['notes', 'Quick notes'],
    ] as const
  ).map(([key, label]) =>
    meta({
      path: `layout.widgets.${key}`,
      section: 'layout',
      label,
      kind: 'toggle',
      keywords: ['widget', 'show', 'hide', key],
    }),
  ),

  // Search
  meta({
    path: 'search.engine',
    section: 'search',
    label: 'Engine',
    help: 'Suggestions follow the selected engine where supported.',
    kind: 'select',
    options: [
      { value: 'google', label: 'Google' },
      { value: 'bing', label: 'Bing' },
      { value: 'duckduckgo', label: 'DuckDuckGo' },
      { value: 'youtube', label: 'YouTube' },
      { value: 'custom', label: 'Custom' },
    ],
    keywords: ['google', 'bing', 'duckduckgo', 'youtube'],
  }),
  meta({
    path: 'search.customEngine.name',
    section: 'search',
    label: 'Custom engine name',
    kind: 'text',
    placeholder: 'Kagi',
    maxLength: 24,
    keywords: ['custom', 'engine'],
  }),
  meta({
    path: 'search.customEngine.urlTemplate',
    section: 'search',
    label: 'Custom engine URL',
    help: 'Use %s where the query goes.',
    kind: 'text',
    placeholder: 'https://example.com/search?q=%s',
    validate: 'url-template',
    keywords: ['custom', 'url', 'query'],
  }),
  meta({
    path: 'search.suggestions',
    section: 'search',
    label: 'Suggestions',
    help: 'Network suggestions from the selected engine.',
    kind: 'toggle',
    keywords: ['autocomplete', 'typeahead'],
  }),
  meta({
    path: 'search.recentSearches',
    section: 'search',
    label: 'Recent searches',
    help: 'Shown on focus, stored only on this device.',
    kind: 'toggle',
    keywords: ['history', 'recent'],
  }),
  meta({
    path: 'search.openInNewTab',
    section: 'search',
    label: 'Open results in a new tab',
    kind: 'toggle',
    keywords: ['tab', 'window'],
  }),
  meta({
    path: 'search.autofocus',
    section: 'search',
    label: 'Focus search on open',
    kind: 'toggle',
    keywords: ['cursor', 'typing', 'ready'],
  }),

  // Widgets
  meta({
    path: 'widgets.weather.city',
    section: 'widgets',
    label: 'Weather city',
    help: 'Search for a city; coordinates stay on this device.',
    kind: 'text',
    placeholder: 'City',
    keywords: ['location', 'weather', 'forecast'],
  }),
  meta({
    path: 'widgets.weather.units',
    section: 'widgets',
    label: 'Temperature units',
    kind: 'segmented',
    options: [
      { value: 'auto', label: 'Auto' },
      { value: 'c', label: '°C' },
      { value: 'f', label: '°F' },
    ],
    keywords: ['celsius', 'fahrenheit', 'weather'],
  }),
  meta({
    path: 'widgets.weather.forecast',
    section: 'widgets',
    label: 'Five-day forecast',
    help: 'Show the extended forecast inside the weather popover.',
    kind: 'toggle',
    keywords: ['weather', 'week', 'forecast'],
  }),
  meta({
    path: 'widgets.focus.workMinutes',
    section: 'widgets',
    label: 'Focus length',
    kind: 'slider',
    min: 5,
    max: 90,
    step: 5,
    unit: 'min',
    keywords: ['pomodoro', 'timer', 'work'],
  }),
  meta({
    path: 'widgets.focus.breakMinutes',
    section: 'widgets',
    label: 'Break length',
    kind: 'slider',
    min: 1,
    max: 30,
    step: 1,
    unit: 'min',
    keywords: ['pomodoro', 'timer', 'rest'],
  }),
  meta({
    path: 'widgets.focus.autoCycle',
    section: 'widgets',
    label: 'Auto-cycle',
    help: 'Start the next focus or break phase automatically.',
    kind: 'toggle',
    keywords: ['pomodoro', 'automatic'],
  }),
  meta({
    path: 'widgets.focus.chime',
    section: 'widgets',
    label: 'Completion chime',
    help: 'A soft two-tone sound generated locally.',
    kind: 'toggle',
    keywords: ['sound', 'audio', 'bell'],
  }),

  // Integrations
  meta({
    path: 'integrations.spotifyClientId',
    section: 'integrations',
    label: 'Spotify client ID',
    help: 'From your Spotify developer app. Stored only in this browser.',
    kind: 'text',
    placeholder: '32-character client ID',
    maxLength: 128,
    validate: 'client-id',
    keywords: ['spotify', 'oauth', 'client'],
  }),
];

export const SETTINGS_BY_PATH = new Map(SETTINGS_REGISTRY.map((entry) => [entry.path, entry]));

export function getSettingMeta(path: string): SettingMeta | undefined {
  return SETTINGS_BY_PATH.get(path);
}

export function settingsForSection(section: SettingsSectionId): SettingMeta[] {
  return SETTINGS_REGISTRY.filter((entry) => entry.section === section);
}

export const ADVANCED_PATHS = SETTINGS_REGISTRY.filter((entry) => entry.advanced).map(
  (entry) => entry.path,
);
