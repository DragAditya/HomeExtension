const STORAGE_KEY = 'lumen.iconCache.v1';
const MAX_ICON_BYTES = 192 * 1024;
const MAX_DATA_URL_LENGTH = 300 * 1024;
const MAX_ENTRIES = 32;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

type IconCacheEntry = {
  data: string;
  savedAt: number;
};

type IconCacheStore = Record<string, IconCacheEntry>;

const inFlight = new Map<string, Promise<void>>();

function readStore(): IconCacheStore {
  try {
    if (typeof window === 'undefined') return {};
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    const store: IconCacheStore = {};
    const now = Date.now();
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!value || typeof value !== 'object') continue;
      const entry = value as Partial<IconCacheEntry>;
      if (
        typeof entry.data !== 'string' ||
        !entry.data.startsWith('data:image/') ||
        typeof entry.savedAt !== 'number' ||
        !Number.isFinite(entry.savedAt) ||
        now - entry.savedAt > MAX_AGE_MS
      ) {
        continue;
      }
      store[key] = { data: entry.data, savedAt: entry.savedAt };
    }
    return store;
  } catch {
    return {};
  }
}

function writeStore(store: IconCacheStore): void {
  try {
    if (typeof window === 'undefined') return;
    const entries = Object.entries(store)
      .sort(([, left], [, right]) => right.savedAt - left.savedAt)
      .slice(0, MAX_ENTRIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // A full or disabled localStorage should never stop the grid from rendering.
  }
}

export function getCachedIcon(key: string): string | null {
  if (!key) return null;
  return readStore()[key]?.data ?? null;
}

export function removeCachedIcon(key: string): void {
  if (!key) return;
  const store = readStore();
  if (!store[key]) return;
  delete store[key];
  writeStore(store);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error ?? new Error('Could not read icon'));
    reader.readAsDataURL(blob);
  });
}

export function cacheIcon(key: string, source: string): Promise<void> {
  if (!key || !source) return Promise.resolve();
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return Promise.resolve();

  const existing = inFlight.get(key);
  if (existing) return existing;

  const task = (async () => {
    const store = readStore();
    if (store[key]) return;
    try {
      const response = await fetch(source, {
        cache: 'force-cache',
        credentials: 'omit',
        mode: 'cors',
        referrerPolicy: 'no-referrer',
      });
      if (!response.ok) return;
      const blob = await response.blob();
      if (blob.size <= 0 || blob.size > MAX_ICON_BYTES) return;
      if (blob.type && !blob.type.startsWith('image/') && blob.type !== 'application/octet-stream') {
        return;
      }
      const data = await blobToDataUrl(blob);
      if (!data.startsWith('data:image/') || data.length > MAX_DATA_URL_LENGTH) return;
      store[key] = { data, savedAt: Date.now() };
      writeStore(store);
    } catch {
      // Remote icon availability is best-effort; the monogram remains available.
    }
  })().finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, task);
  return task;
}
