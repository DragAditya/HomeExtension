import { contrastText, mixHex, rgbChannels, rgba } from './color';
import type { Settings, ThemeMode } from './settings/types';

export type ResolvedTheme = 'dark' | 'light';
export type Daypart = 'dawn' | 'day' | 'dusk' | 'night';

export type GlassTokens = {
  blur: number;
  fill: number;
  border: number;
  shadow: number;
  sat: number;
};

export function resolveTheme(mode: ThemeMode, prefersDark?: boolean): ResolvedTheme {
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';
  if (typeof prefersDark === 'boolean') return prefersDark ? 'dark' : 'light';
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
}

export function getDaypart(date: Date): Daypart {
  const hour = date.getHours();
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 21) return 'dusk';
  return 'night';
}

export function glassTokens(
  intensity: number,
  theme: ResolvedTheme,
  readability: boolean,
): GlassTokens {
  const ratio = Math.min(100, Math.max(0, intensity)) / 100;
  const boost = readability ? 0.08 : 0;
  return {
    blur: Math.round(4 + ratio * 28),
    fill: theme === 'dark' ? 0.16 + ratio * 0.36 + boost : 0.34 + ratio * 0.38 + boost,
    border: 0.05 + ratio * 0.13 + (readability ? 0.03 : 0),
    shadow: 0.16 + ratio * 0.44,
    sat: 1.05 + ratio * 0.5,
  };
}

function surfaceIntensity(global: number, override: number | null): number {
  return override === null || override === undefined ? global : override;
}

export function applyTheme(settings: Settings, now = new Date()): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const theme = resolveTheme(settings.appearance.theme);
  const readability = settings.appearance.readabilityBoost;
  const rawAccent = settings.appearance.accent;
  const accent = theme === 'light' ? mixHex(rawAccent, '#1a1410', 0.2) : rawAccent;
  const global = glassTokens(settings.appearance.glassIntensity, theme, readability);

  root.dataset.theme = theme;
  root.dataset.motion = settings.appearance.motion;
  root.dataset.density = settings.appearance.density;
  root.dataset.alignment = settings.layout.alignment;
  root.dataset.readability = readability ? 'on' : 'off';
  root.dataset.daypart = getDaypart(now);
  root.dataset.drift =
    settings.appearance.effects.drift && settings.appearance.motion === 'full' ? 'on' : 'off';
  root.dataset.parallax =
    settings.appearance.effects.parallax && settings.appearance.motion === 'full' ? 'on' : 'off';
  root.dataset.scene =
    settings.appearance.wallpaper.kind === 'scene'
      ? settings.appearance.wallpaper.scene
      : 'custom';
  root.dataset.wallpaperKind = settings.appearance.wallpaper.kind;
  root.style.colorScheme = theme;

  const style = root.style;
  style.setProperty('--accent', accent);
  style.setProperty('--accent-rgb', rgbChannels(accent));
  style.setProperty('--accent-contrast', contrastText(accent));
  style.setProperty('--accent-soft', rgba(accent, theme === 'dark' ? 0.18 : 0.14));
  style.setProperty('--accent-faint', rgba(accent, 0.09));
  style.setProperty('--wallpaper-dim', String(settings.appearance.wallpaperDim / 100));
  style.setProperty('--wallpaper-blur', `${settings.appearance.wallpaperBlur}px`);
  style.setProperty('--wallpaper-sat', `${settings.appearance.wallpaperSaturation}%`);
  style.setProperty('--wallpaper-fit', settings.appearance.wallpaperFit);
  style.setProperty('--grain-opacity', String((settings.appearance.effects.grain / 100) * 0.16));
  style.setProperty(
    '--vignette-opacity',
    String((settings.appearance.effects.vignette / 100) * 0.92),
  );
  style.setProperty('--glow-strength', String(settings.appearance.effects.glow / 100));
  style.setProperty('--radius', `${settings.appearance.radius}px`);
  style.setProperty('--radius-sm', `${Math.max(8, settings.appearance.radius * 0.62)}px`);
  style.setProperty('--radius-xs', `${Math.max(6, settings.appearance.radius * 0.4)}px`);

  style.setProperty('--glass-blur', `${global.blur}px`);
  style.setProperty('--glass-sat', String(global.sat));
  style.setProperty('--glass-fill', glassFill(theme, global.fill));
  style.setProperty('--glass-border', glassBorder(theme, global.border));
  style.setProperty('--glass-shadow', glassShadow(theme, global.shadow));

  const surfaces = [
    ['search', surfaceIntensity(settings.appearance.glassIntensity, settings.advanced.overrides.search)],
    ['shortcuts', surfaceIntensity(settings.appearance.glassIntensity, settings.advanced.overrides.shortcuts)],
    ['dock', surfaceIntensity(settings.appearance.glassIntensity, settings.advanced.overrides.dock)],
  ] as const;

  for (const [name, intensity] of surfaces) {
    const tokens = glassTokens(intensity, theme, readability);
    style.setProperty(`--${name}-blur`, `${tokens.blur}px`);
    style.setProperty(`--${name}-sat`, String(tokens.sat));
    style.setProperty(`--${name}-fill`, glassFill(theme, tokens.fill));
    style.setProperty(`--${name}-border`, glassBorder(theme, tokens.border));
    style.setProperty(`--${name}-shadow`, glassShadow(theme, tokens.shadow));
  }
}

function glassFill(theme: ResolvedTheme, alpha: number): string {
  const clamped = Math.min(1, Math.max(0, alpha));
  return theme === 'dark'
    ? `rgba(13, 19, 34, ${clamped.toFixed(3)})`
    : `rgba(255, 253, 248, ${clamped.toFixed(3)})`;
}

function glassBorder(theme: ResolvedTheme, alpha: number): string {
  const clamped = Math.min(1, Math.max(0, alpha));
  return theme === 'dark'
    ? `rgba(255, 255, 255, ${clamped.toFixed(3)})`
    : `rgba(19, 23, 34, ${clamped.toFixed(3)})`;
}

function glassShadow(theme: ResolvedTheme, alpha: number): string {
  const clamped = Math.min(1, Math.max(0, alpha));
  return theme === 'dark'
    ? `0 24px 80px -24px rgba(0, 0, 0, ${clamped.toFixed(3)})`
    : `0 24px 60px -28px rgba(49, 38, 25, ${(clamped * 0.7).toFixed(3)})`;
}

export function watchSystemTheme(callback: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const query = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => callback();
  query.addEventListener('change', handler);
  return () => query.removeEventListener('change', handler);
}
