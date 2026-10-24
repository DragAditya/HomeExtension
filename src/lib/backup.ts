import { normalizeSettings } from './settings/normalize';
import type { Settings } from './settings/types';

export const BACKUP_APP = 'lumen';
export const BACKUP_VERSION = 1;

export type LumenBackup = {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: string;
  settings: Settings;
};

export function serializeBackup(settings: Settings): string {
  const payload: LumenBackup = {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
  };
  return JSON.stringify(payload, null, 2);
}

export function backupFilename(date = new Date()): string {
  return `lumen-backup-${date.toISOString().slice(0, 10)}.json`;
}

export function parseBackup(
  text: string,
): { ok: true; settings: Settings; exportedAt: string | null } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' };
  }
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'That file does not contain a Lumen backup.' };
  }
  const record = parsed as Record<string, unknown>;
  if (record.app !== undefined && record.app !== BACKUP_APP) {
    return { ok: false, error: 'That backup was made by another app.' };
  }
  const source = record.settings ?? parsed;
  if (!source || typeof source !== 'object') {
    return { ok: false, error: 'That backup is missing its settings.' };
  }
  const settings = normalizeSettings(source);
  const exportedAt = typeof record.exportedAt === 'string' ? record.exportedAt : null;
  return { ok: true, settings, exportedAt };
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}
