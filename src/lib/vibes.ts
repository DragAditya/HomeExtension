import type { SceneId, ThemeMode, VibeId } from './settings/types';

export type Vibe = {
  id: VibeId;
  label: string;
  blurb: string;
  theme: ThemeMode;
  accent: string;
  scene: SceneId;
  wallpaperDim: number;
  wallpaperSaturation: number;
  effects: {
    grain: number;
    vignette: number;
    glow: number;
    drift: boolean;
  };
};

export const VIBES: Record<VibeId, Vibe> = {
  aurora: {
    id: 'aurora',
    label: 'Aurora',
    blurb: 'Periwinkle light over a drifting polar sky.',
    theme: 'dark',
    accent: '#7c9bff',
    scene: 'aurora-veil',
    wallpaperDim: 34,
    wallpaperSaturation: 100,
    effects: { grain: 10, vignette: 26, glow: 30, drift: true },
  },
  frost: {
    id: 'frost',
    label: 'Frost',
    blurb: 'Cold glass, pale ice, and a quiet teal edge.',
    theme: 'dark',
    accent: '#5fe3d3',
    scene: 'glacial-dusk',
    wallpaperDim: 30,
    wallpaperSaturation: 90,
    effects: { grain: 6, vignette: 20, glow: 24, drift: false },
  },
  ember: {
    id: 'ember',
    label: 'Ember',
    blurb: 'Charcoal night warmed by a low amber haze.',
    theme: 'dark',
    accent: '#ffb07a',
    scene: 'ember-horizon',
    wallpaperDim: 38,
    wallpaperSaturation: 108,
    effects: { grain: 14, vignette: 34, glow: 36, drift: true },
  },
  noir: {
    id: 'noir',
    label: 'Noir',
    blurb: 'Near-black, monochrome, nothing extra.',
    theme: 'dark',
    accent: '#d7def0',
    scene: 'midnight-bloom',
    wallpaperDim: 42,
    wallpaperSaturation: 70,
    effects: { grain: 18, vignette: 40, glow: 0, drift: false },
  },
  daylight: {
    id: 'daylight',
    label: 'Daylight',
    blurb: 'Warm paper, terracotta ink, soft morning shadow.',
    theme: 'light',
    accent: '#a34f24',
    scene: 'paper-daylight',
    wallpaperDim: 10,
    wallpaperSaturation: 100,
    effects: { grain: 8, vignette: 8, glow: 0, drift: false },
  },
};

export const VIBE_IDS = Object.keys(VIBES) as VibeId[];

export const SCENES: Array<{ id: SceneId; label: string; vibe?: VibeId }> = [
  { id: 'aurora-veil', label: 'Aurora Veil', vibe: 'aurora' },
  { id: 'glacial-dusk', label: 'Glacial Dusk', vibe: 'frost' },
  { id: 'ember-horizon', label: 'Ember Horizon', vibe: 'ember' },
  { id: 'midnight-bloom', label: 'Midnight Bloom', vibe: 'noir' },
  { id: 'paper-daylight', label: 'Paper Daylight', vibe: 'daylight' },
  { id: 'deep-field', label: 'Deep Field' },
];

export function isVibeId(value: unknown): value is VibeId {
  return typeof value === 'string' && value in VIBES;
}

export function inferVibe(settings: {
  appearance: {
    theme: ThemeMode;
    accent: string;
    wallpaper: { kind: string; scene?: string };
    wallpaperDim: number;
    wallpaperSaturation: number;
    effects: { grain: number; vignette: number; glow: number; drift: boolean };
  };
}): VibeId | 'custom' {
  for (const vibe of Object.values(VIBES)) {
    const appearance = settings.appearance;
    if (
      appearance.theme === vibe.theme &&
      appearance.accent.toLowerCase() === vibe.accent.toLowerCase() &&
      appearance.wallpaper.kind === 'scene' &&
      appearance.wallpaper.scene === vibe.scene &&
      appearance.wallpaperDim === vibe.wallpaperDim &&
      appearance.wallpaperSaturation === vibe.wallpaperSaturation &&
      appearance.effects.grain === vibe.effects.grain &&
      appearance.effects.vignette === vibe.effects.vignette &&
      appearance.effects.glow === vibe.effects.glow &&
      appearance.effects.drift === vibe.effects.drift
    ) {
      return vibe.id;
    }
  }
  return 'custom';
}
