import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, cloneDefaults } from '../src/lib/settings/defaults';
import {
  MAX_NOTE_LENGTH,
  MAX_SHORTCUTS,
  normalizeSettings,
  normalizeShortcut,
  normalizeShortcuts,
} from '../src/lib/settings/normalize';
import { getValue, setValue } from '../src/lib/settings/paths';

describe('settings paths', () => {
  it('reads nested values', () => {
    expect(getValue(DEFAULT_SETTINGS, 'appearance.effects.grain')).toBe(10);
    expect(getValue(DEFAULT_SETTINGS, 'missing.path')).toBeUndefined();
  });

  it('updates immutably', () => {
    const next = setValue(DEFAULT_SETTINGS, 'appearance.accent', '#ff0000');
    expect(next).not.toBe(DEFAULT_SETTINGS);
    expect(next.appearance.accent).toBe('#ff0000');
    expect(DEFAULT_SETTINGS.appearance.accent).toBe('#7c9bff');
    expect(next.appearance).not.toBe(DEFAULT_SETTINGS.appearance);
  });
});

describe('normalizeSettings', () => {
  it('round-trips the defaults', () => {
    expect(normalizeSettings(DEFAULT_SETTINGS)).toEqual(DEFAULT_SETTINGS);
  });

  it('clamps numbers and rejects invalid choices', () => {
    const settings = normalizeSettings({
      appearance: {
        glassIntensity: 900,
        radius: 2,
        theme: 'neon',
        accent: '#abc',
        wallpaperDim: -20,
      },
      layout: { shortcutColumns: 5 },
      search: { engine: 'nope' },
    });
    expect(settings.appearance.glassIntensity).toBe(100);
    expect(settings.appearance.radius).toBe(8);
    expect(settings.appearance.theme).toBe('dark');
    expect(settings.appearance.accent).toBe('#aabbcc');
    expect(settings.appearance.wallpaperDim).toBe(0);
    expect(settings.layout.shortcutColumns).toBe(4);
    expect(settings.search.engine).toBe('google');
  });

  it('falls back when a custom search template is invalid', () => {
    const settings = normalizeSettings({
      search: {
        engine: 'custom',
        customEngine: { name: 'Kagi', urlTemplate: 'not a url' },
      },
    });
    expect(settings.search.engine).toBe('google');
    expect(settings.search.customEngine.urlTemplate).toBe(
      DEFAULT_SETTINGS.search.customEngine.urlTemplate,
    );
  });

  it('keeps a valid custom search template', () => {
    const settings = normalizeSettings({
      search: {
        engine: 'custom',
        customEngine: { name: 'Kagi', urlTemplate: 'https://kagi.com/search?q=%s' },
      },
    });
    expect(settings.search.engine).toBe('custom');
    expect(settings.search.customEngine.name).toBe('Kagi');
  });

  it('clamps notes and shortcuts', () => {
    const settings = normalizeSettings({
      widgets: { notes: { text: 'x'.repeat(MAX_NOTE_LENGTH + 200) } },
      shortcuts: Array.from({ length: MAX_SHORTCUTS + 5 }, (_, index) => ({
        id: `s${index}`,
        name: `Site ${index}`,
        url: `https://example.com/${index}`,
      })),
    });
    expect(settings.widgets.notes.text).toHaveLength(MAX_NOTE_LENGTH);
    expect(settings.shortcuts).toHaveLength(MAX_SHORTCUTS);
  });

  it('infers a vibe from matching appearance values', () => {
    const aurora = normalizeSettings(cloneDefaults());
    expect(aurora.appearance.vibe).toBe('aurora');

    const custom = normalizeSettings({
      ...cloneDefaults(),
      appearance: { ...cloneDefaults().appearance, accent: '#ff0000', vibe: undefined },
    });
    expect(custom.appearance.vibe).toBe('custom');
  });

  it('drops an invalid wallpaper and keeps a valid remote one', () => {
    const broken = normalizeSettings({
      appearance: { wallpaper: { kind: 'image', url: 'blob:https://x/y' } },
    });
    expect(broken.appearance.wallpaper.kind).toBe('scene');

    const remote = normalizeSettings({
      appearance: { wallpaper: { kind: 'video', url: 'https://example.com/bg.mp4' } },
    });
    expect(remote.appearance.wallpaper).toEqual({
      kind: 'video',
      url: 'https://example.com/bg.mp4',
    });
  });

  it('does not accept prototype-polluting input as a section', () => {
    const settings = normalizeSettings({ __proto__: { polluted: true } });
    expect((settings as unknown as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe('shortcut normalization', () => {
  it('adds https to a bare host and rejects script urls', () => {
    expect(normalizeShortcut({ name: 'Example', url: 'example.com' })?.url).toBe(
      'https://example.com/',
    );
    expect(normalizeShortcut({ name: 'Bad', url: 'javascript:alert(1)' })).toBeNull();
    expect(normalizeShortcut({ name: '', url: 'https://example.com' })).toBeNull();
  });

  it('keeps only https icons', () => {
    expect(
      normalizeShortcut({ name: 'A', url: 'https://a.com', icon: 'javascript:x' })?.icon,
    ).toBeUndefined();
    expect(
      normalizeShortcut({ name: 'A', url: 'https://a.com', icon: 'https://a.com/i.png' })?.icon,
    ).toBe('https://a.com/i.png');
  });

  it('drops malformed entries', () => {
    expect(normalizeShortcuts([null, 3, { name: 'ok', url: 'ok.com' }])).toHaveLength(1);
  });
});
