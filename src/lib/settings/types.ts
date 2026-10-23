export type ThemeMode = 'dark' | 'light' | 'system';
export type DateStyle = 'short' | 'long';
export type Alignment = 'center' | 'left';
export type Density = 'comfortable' | 'compact';
export type MotionMode = 'full' | 'reduced';
export type VibeId = 'aurora' | 'frost' | 'ember' | 'noir' | 'daylight';
export type SceneId =
  | 'aurora-veil'
  | 'glacial-dusk'
  | 'ember-horizon'
  | 'midnight-bloom'
  | 'paper-daylight'
  | 'deep-field';
export type WallpaperSource =
  | { kind: 'scene'; scene: SceneId }
  | { kind: 'image'; url: string; id?: string }
  | { kind: 'video'; url: string; id?: string };
export type SearchEngineId = 'google' | 'bing' | 'duckduckgo' | 'youtube' | 'custom';
export type Units = 'auto' | 'c' | 'f';
export type SettingsSectionId =
  | 'appearance'
  | 'layout'
  | 'search'
  | 'shortcuts'
  | 'widgets'
  | 'integrations'
  | 'data'
  | 'about';

export type Shortcut = {
  id: string;
  name: string;
  url: string;
  icon?: string;
};

export type Settings = {
  schemaVersion: 2;
  onboarded: boolean;
  profile: {
    name: string;
  };
  appearance: {
    theme: ThemeMode;
    accent: string;
    vibe: VibeId | 'custom';
    wallpaper: WallpaperSource;
    wallpaperFit: 'cover' | 'contain';
    wallpaperDim: number;
    wallpaperBlur: number;
    wallpaperSaturation: number;
    timeShift: boolean;
    effects: {
      grain: number;
      vignette: number;
      glow: number;
      drift: boolean;
      parallax: boolean;
    };
    glassIntensity: number;
    radius: number;
    density: Density;
    readabilityBoost: boolean;
    motion: MotionMode;
  };
  layout: {
    alignment: Alignment;
    hour12: boolean;
    showSeconds: boolean;
    dateStyle: DateStyle;
    shortcutColumns: 4 | 6 | 8;
    widgets: {
      greeting: boolean;
      clock: boolean;
      date: boolean;
      search: boolean;
      shortcuts: boolean;
      weather: boolean;
      spotify: boolean;
      focus: boolean;
      notes: boolean;
    };
  };
  search: {
    engine: SearchEngineId;
    customEngine: {
      name: string;
      urlTemplate: string;
    };
    suggestions: boolean;
    recentSearches: boolean;
    openInNewTab: boolean;
    autofocus: boolean;
  };
  shortcuts: Shortcut[];
  widgets: {
    weather: {
      city: string;
      latitude: number | null;
      longitude: number | null;
      units: Units;
      forecast: boolean;
    };
    focus: {
      workMinutes: number;
      breakMinutes: number;
      autoCycle: boolean;
      chime: boolean;
      sessionsToday: number;
      lastSessionDate: string;
    };
    notes: {
      text: string;
    };
  };
  integrations: {
    spotifyClientId: string;
  };
  advanced: {
    overrides: {
      search: number | null;
      shortcuts: number | null;
      dock: number | null;
    };
  };
};

export type WeatherData = {
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    wind: number;
    code: number;
    isDay: boolean;
  };
  hourly: Array<{ time: string; temp: number; code: number; precip: number }>;
  daily: Array<{
    date: string;
    code: number;
    high: number;
    low: number;
    sunrise?: string;
    sunset?: string;
  }>;
  fetchedAt: number;
  units: 'c' | 'f';
  stale?: boolean;
};

export type CityResult = {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
};
