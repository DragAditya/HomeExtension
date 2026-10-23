import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../src/lib/settings/defaults';
import { getValue } from '../src/lib/settings/paths';
import { SECTION_META, SETTINGS_REGISTRY } from '../src/lib/settings/registry';

describe('settings registry', () => {
  it('has a unique path for every control', () => {
    const paths = SETTINGS_REGISTRY.map((entry) => entry.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('points every control at a real default value', () => {
    for (const entry of SETTINGS_REGISTRY) {
      expect(getValue(DEFAULT_SETTINGS, entry.path), entry.path).not.toBeUndefined();
      expect(entry.defaultValue, entry.path).toEqual(getValue(DEFAULT_SETTINGS, entry.path));
    }
  });

  it('assigns every control to a known section', () => {
    for (const entry of SETTINGS_REGISTRY) {
      expect(SECTION_META[entry.section], entry.path).toBeTruthy();
    }
  });

  it('gives every slider a finite range and a default inside it', () => {
    for (const entry of SETTINGS_REGISTRY.filter((item) => item.kind === 'slider')) {
      expect(entry.min, entry.path).toBeTypeOf('number');
      expect(entry.max, entry.path).toBeTypeOf('number');
      const value = Number(entry.defaultValue);
      expect(value, entry.path).toBeGreaterThanOrEqual(entry.min ?? 0);
      expect(value, entry.path).toBeLessThanOrEqual(entry.max ?? 0);
    }
  });

  it('gives every choice control options that include the default', () => {
    for (const entry of SETTINGS_REGISTRY.filter(
      (item) => item.kind === 'select' || item.kind === 'segmented',
    )) {
      expect(entry.options?.length, entry.path).toBeGreaterThan(0);
      expect(
        entry.options?.some((option) => String(option.value) === String(entry.defaultValue)),
        entry.path,
      ).toBe(true);
    }
  });
});
