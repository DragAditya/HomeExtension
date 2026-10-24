import type { SearchEngineId } from './settings/types';

export type SearchEngine = {
  id: SearchEngineId;
  label: string;
  short: string;
  search: string;
  suggest?: 'google' | 'bing' | 'duckduckgo' | 'youtube';
};

export const SEARCH_ENGINES: Record<SearchEngineId, SearchEngine> = {
  google: {
    id: 'google',
    label: 'Google',
    short: 'G',
    search: 'https://www.google.com/search?q=%s',
    suggest: 'google',
  },
  bing: {
    id: 'bing',
    label: 'Bing',
    short: 'B',
    search: 'https://www.bing.com/search?q=%s',
    suggest: 'bing',
  },
  duckduckgo: {
    id: 'duckduckgo',
    label: 'DuckDuckGo',
    short: 'D',
    search: 'https://duckduckgo.com/?q=%s',
    suggest: 'duckduckgo',
  },
  youtube: {
    id: 'youtube',
    label: 'YouTube',
    short: 'YT',
    search: 'https://www.youtube.com/results?search_query=%s',
    suggest: 'youtube',
  },
  custom: {
    id: 'custom',
    label: 'Custom',
    short: 'C',
    search: 'https://www.google.com/search?q=%s',
  },
};

export const ENGINE_OPTIONS: SearchEngine[] = [
  SEARCH_ENGINES.google,
  SEARCH_ENGINES.bing,
  SEARCH_ENGINES.duckduckgo,
  SEARCH_ENGINES.youtube,
];

export function buildSearchUrl(
  engine: SearchEngineId,
  query: string,
  custom?: { name: string; urlTemplate: string },
): string {
  const encoded = encodeURIComponent(query.trim());
  if (engine === 'custom' && custom?.urlTemplate.includes('%s')) {
    return custom.urlTemplate.replace('%s', encoded);
  }
  return SEARCH_ENGINES[engine].search.replace('%s', encoded);
}

export function validateCustomEngine(template: string): boolean {
  if (!template.includes('%s')) return false;
  try {
    const sample = template.replace('%s', 'lumen');
    const parsed = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(sample) ? sample : `https://${sample}`);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function suggestionEndpoint(kind: NonNullable<SearchEngine['suggest']>, query: string): string {
  const encoded = encodeURIComponent(query);
  if (kind === 'google') {
    return `https://suggestqueries.google.com/complete/search?client=firefox&q=${encoded}`;
  }
  if (kind === 'youtube') {
    return `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encoded}`;
  }
  if (kind === 'bing') {
    return `https://api.bing.com/osjson.aspx?query=${encoded}`;
  }
  return `https://duckduckgo.com/ac/?type=list&q=${encoded}`;
}

export function parseSuggestions(kind: SearchEngineId, data: unknown): string[] {
  if (kind === 'duckduckgo') {
    if (!Array.isArray(data)) return [];
    return data
      .map((entry) => {
        if (typeof entry === 'string') return entry;
        if (entry && typeof entry === 'object' && 'phrase' in entry) {
          return String((entry as { phrase: unknown }).phrase);
        }
        return '';
      })
      .filter(Boolean);
  }
  if (!Array.isArray(data)) return [];
  const list = data[1];
  if (!Array.isArray(list)) return [];
  return list.filter((entry): entry is string => typeof entry === 'string');
}

export async function fetchSuggestions(
  engine: SearchEngineId,
  query: string,
  signal: AbortSignal,
): Promise<string[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const config = SEARCH_ENGINES[engine];
  if (!config.suggest) return [];
  try {
    const response = await fetch(suggestionEndpoint(config.suggest, trimmed), {
      signal,
      credentials: 'omit',
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const data: unknown = await response.json();
    const seen = new Set<string>();
    const results: string[] = [];
    for (const suggestion of parseSuggestions(engine, data)) {
      const clean = suggestion.trim();
      const key = clean.toLowerCase();
      if (!clean || seen.has(key)) continue;
      seen.add(key);
      results.push(clean);
      if (results.length >= 7) break;
    }
    return results;
  } catch {
    return [];
  }
}
