import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../src/lib/settings/defaults';
import { migrateLegacy } from '../src/lib/settings/migrate';

describe('migrateLegacy', () => {
  it('returns null when there is nothing to migrate', () => {
    expect(migrateLegacy(null, null)).toBeNull();
    expect(migrateLegacy(undefined, [])).toBeNull();
  });

  it('maps a full legacy settings object', () => {
    const settings = migrateLegacy(
      {
        theme: 'light',
        accent: '#FF0000',
        blur: 30,
        glow: false,
        showClock: false,
        showGreeting: true,
        showDate: false,
        engine: 'DuckDuckGo',
        suggestions: false,
        newTab: true,
        spotifyClientId: 'client-123',
        searchRadius: 20,
        background: {
          type: 'image',
          url: 'https://example.com/wall.jpg',
          fit: 'contain',
          dim: 55,
        },
      },
      [{ id: 'a', name: 'Example', url: 'https://example.com' }],
      null,
    );

    expect(settings).not.toBeNull();
    if (!settings) return;
    expect(settings.onboarded).toBe(true);
    expect(settings.appearance.theme).toBe('light');
    expect(settings.appearance.accent).toBe('#ff0000');
    expect(settings.appearance.glassIntensity).toBe(100);
    expect(settings.appearance.effects.glow).toBe(0);
    expect(settings.appearance.radius).toBe(20);
    expect(settings.appearance.wallpaper).toEqual({
      kind: 'image',
      url: 'https://example.com/wall.jpg',
    });
    expect(settings.appearance.wallpaperFit).toBe('contain');
    expect(settings.appearance.wallpaperDim).toBe(55);
    expect(settings.layout.widgets.clock).toBe(false);
    expect(settings.layout.widgets.greeting).toBe(true);
    expect(settings.layout.widgets.date).toBe(false);
    expect(settings.search.engine).toBe('duckduckgo');
    expect(settings.search.suggestions).toBe(false);
    expect(settings.search.openInNewTab).toBe(true);
    expect(settings.integrations.spotifyClientId).toBe('client-123');
    expect(settings.shortcuts).toHaveLength(1);
  });

  it('migrates shortcuts on their own', () => {
    const settings = migrateLegacy(null, [
      { id: 'a', name: 'Example', url: 'https://example.com' },
    ]);
    expect(settings?.shortcuts).toHaveLength(1);
    expect(settings?.onboarded).toBe(true);
  });

  it('migrates only the fields that exist', () => {
    const settings = migrateLegacy({ showDate: false }, null);
    expect(settings?.layout.widgets.date).toBe(false);
    expect(settings?.appearance.theme).toBe(DEFAULT_SETTINGS.appearance.theme);
    expect(settings?.layout.widgets.clock).toBe(true);
  });

  it('collapses changed legacy search material values into one override', () => {
    const settings = migrateLegacy(
      { searchBlur: 24, searchOpacity: 80, searchBorder: 25, searchGlow: 22, searchTint: 12 },
      null,
    );
    expect(settings?.advanced.overrides.search).toBeTypeOf('number');
    expect(settings?.advanced.overrides.search).toBeGreaterThan(0);
  });

  it('does not create overrides when legacy values are at their defaults', () => {
    const settings = migrateLegacy(
      {
        searchBlur: 24,
        searchOpacity: 46,
        searchBorder: 25,
        searchGlow: 22,
        searchTint: 12,
        shortcutOpacity: 40,
        shortcutBlur: 18,
        shortcutBorder: 20,
        shortcutGlow: 14,
      },
      null,
    );
    expect(settings?.advanced.overrides.search).toBeNull();
    expect(settings?.advanced.overrides.shortcuts).toBeNull();
  });

  it('ignores blob wallpapers that cannot survive the origin move', () => {
    const settings = migrateLegacy(
      { background: { type: 'image', url: 'blob:https://old/abc' } },
      null,
    );
    expect(settings?.appearance.wallpaper.kind).toBe('scene');
  });

  it('takes the separate client id key when present', () => {
    const settings = migrateLegacy({}, null, ' separate-id ');
    expect(settings?.integrations.spotifyClientId).toBe('separate-id');
  });

  it('marks a migrated profile as onboarded even when the payload is sparse', () => {
    const settings = migrateLegacy({}, null);
    expect(settings?.onboarded).toBe(true);
  });
});
