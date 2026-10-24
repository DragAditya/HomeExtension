import { RECENT_SEARCHES_KEY, storageGet, storageSet } from './storage';

const LIMIT = 8;

export async function loadRecentSearches(): Promise<string[]> {
  try {
    const stored = await storageGet<unknown>(RECENT_SEARCHES_KEY);
    if (!Array.isArray(stored)) return [];
    return stored.filter((entry): entry is string => typeof entry === 'string').slice(0, LIMIT);
  } catch {
    return [];
  }
}

export function mergeRecentSearches(existing: string[], query: string): string[] {
  const clean = query.trim().replace(/\s+/g, ' ');
  if (!clean) return existing;
  const key = clean.toLowerCase();
  return [clean, ...existing.filter((entry) => entry.toLowerCase() !== key)].slice(0, LIMIT);
}

export async function addRecentSearch(query: string): Promise<string[]> {
  const existing = await loadRecentSearches();
  const next = mergeRecentSearches(existing, query);
  try {
    await storageSet(RECENT_SEARCHES_KEY, next);
  } catch {
    // History is a convenience, never a blocker.
  }
  return next;
}

export async function clearRecentSearches(): Promise<void> {
  try {
    await storageSet(RECENT_SEARCHES_KEY, []);
  } catch {
    // Ignore.
  }
}
