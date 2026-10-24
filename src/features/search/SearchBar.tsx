import {
  ArrowUpRight,
  ChevronDown,
  Clock3,
  Loader2,
  Search,
  Settings2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ENGINE_OPTIONS,
  SEARCH_ENGINES,
  buildSearchUrl,
  fetchSuggestions,
} from '../../lib/search';
import {
  addRecentSearch,
  clearRecentSearches,
  loadRecentSearches,
} from '../../lib/searchHistory';
import { modCombo } from '../../lib/platform';
import { useSettings } from '../../store/settings';
import { useSpotify } from '../../store/spotify';
import { useUI } from '../../store/ui';
import { SpotifyPlayer } from '../spotify/SpotifyPlayer';

type Item = {
  id: string;
  kind: 'search' | 'suggestion' | 'recent';
  label: string;
  value: string;
};

function Highlight({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  if (!needle) return <>{text}</>;
  const index = text.toLowerCase().indexOf(needle.toLowerCase());
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + needle.length)}</mark>
      {text.slice(index + needle.length)}
    </>
  );
}

export function SearchBar() {
  const engine = useSettings((state) => state.settings.search.engine);
  const customEngine = useSettings((state) => state.settings.search.customEngine);
  const suggestionsEnabled = useSettings((state) => state.settings.search.suggestions);
  const recentEnabled = useSettings((state) => state.settings.search.recentSearches);
  const openInNewTab = useSettings((state) => state.settings.search.openInNewTab);
  const autofocus = useSettings((state) => state.settings.search.autofocus);
  const spotifyWidget = useSettings((state) => state.settings.layout.widgets.spotify);
  const spotifyTrack = useSpotify((state) => Boolean(state.player?.track));
  const set = useSettings((state) => state.set);
  const openSettings = useUI((state) => state.openSettings);
  const openPalette = useUI((state) => state.openPalette);
  const toast = useUI((state) => state.toast);

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [engineMenu, setEngineMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autofocused = useRef(false);

  const currentEngine = SEARCH_ENGINES[engine];
  const engineName =
    engine === 'custom' ? customEngine.name.trim() || 'Custom' : currentEngine.label;
  const engineShort = engine === 'custom' ? (engineName[0] ?? 'C').toUpperCase() : currentEngine.short;

  useEffect(() => {
    if (!autofocus || autofocused.current) return;
    autofocused.current = true;
    const id = window.setTimeout(() => {
      if (!document.querySelector('dialog[open]')) inputRef.current?.focus();
    }, 90);
    return () => window.clearTimeout(id);
  }, [autofocus]);

  useEffect(() => {
    if (recentEnabled) void loadRecentSearches().then(setRecents);
    else setRecents([]);
  }, [recentEnabled]);

  useEffect(() => {
    if (!focused || !suggestionsEnabled || query.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(() => {
      void fetchSuggestions(engine, query, controller.signal).then((results) => {
        if (controller.signal.aborted) return;
        setSuggestions(results);
        setActiveIndex(-1);
        setLoading(false);
      });
    }, 170);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [engine, focused, query, suggestionsEnabled]);

  useEffect(() => {
    if (!engineMenu) return;
    const down = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setEngineMenu(false);
    };
    window.addEventListener('pointerdown', down);
    return () => window.removeEventListener('pointerdown', down);
  }, [engineMenu]);

  const items = useMemo<Item[]>(() => {
    const trimmed = query.trim();
    const list: Item[] = [];
    if (trimmed) {
      list.push({ id: 'verb', kind: 'search', label: trimmed, value: trimmed });
      for (const [index, suggestion] of suggestions.entries()) {
        list.push({
          id: `suggestion-${index}`,
          kind: 'suggestion',
          label: suggestion,
          value: suggestion,
        });
      }
      return list;
    }
    if (recentEnabled) {
      for (const [index, recent] of recents.entries()) {
        list.push({ id: `recent-${index}`, kind: 'recent', label: recent, value: recent });
      }
    }
    return list;
  }, [query, recents, recentEnabled, suggestions]);

  const panelOpen = focused && !engineMenu && (items.length > 0 || loading);

  const submit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const url = buildSearchUrl(engine, trimmed, customEngine);
    if (recentEnabled) {
      void addRecentSearch(trimmed).then(setRecents);
    }
    setFocused(false);
    setEngineMenu(false);
    inputRef.current?.blur();
    try {
      if (openInNewTab) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.assign(url);
      }
    } catch {
      toast('That search could not be opened.', 'error');
    }
  };

  const chooseEngine = (next: typeof engine) => {
    set('search.engine', next);
    setEngineMenu(false);
    setFocused(false);
    window.setTimeout(() => inputRef.current?.focus(), 20);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!items.length) return;
      setActiveIndex((current) => (current + 1 >= items.length ? 0 : current + 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!items.length) return;
      setActiveIndex((current) => (current <= 0 ? items.length - 1 : current - 1));
      return;
    }
    if (event.key === 'Enter') {
      if (activeIndex >= 0 && items[activeIndex]) {
        event.preventDefault();
        submit(items[activeIndex].value);
      }
      return;
    }
    if (event.key === 'Escape') {
      if (engineMenu) {
        setEngineMenu(false);
        return;
      }
      if (query) {
        setQuery('');
        setSuggestions([]);
        return;
      }
      inputRef.current?.blur();
    }
  };

  return (
    <div className="search" ref={containerRef}>
      <form
        className={`search__form ${spotifyWidget && spotifyTrack ? 'search__form--spotify' : ''}`}
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          submit(query);
        }}
      >
        <div className="search__row">
          <span className="search__icon" aria-hidden="true">
            {loading ? <Loader2 className="search__spinner" /> : <Search />}
          </span>
          <input
            ref={inputRef}
            className="search__input"
            type="text"
            value={query}
            aria-label="Search the web"
            role="combobox"
            aria-expanded={panelOpen}
            aria-controls="search-suggestions"
            aria-autocomplete="list"
            aria-activedescendant={
              panelOpen && activeIndex >= 0 ? `search-item-${activeIndex}` : undefined
            }
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            placeholder={`Search ${engineName}…`}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              window.setTimeout(() => setFocused(false), 130);
            }}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={onKeyDown}
          />
          <button
            type="button"
            className="search__engine"
            aria-haspopup="menu"
            aria-expanded={engineMenu}
            aria-label={`Search engine: ${engineName}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setFocused(false);
              setEngineMenu((open) => !open);
            }}
          >
            <span className="engine-option__mark" aria-hidden="true">
              {engineShort}
            </span>
            <span>{engineName}</span>
            <ChevronDown className="search__engine-caret" aria-hidden="true" />
          </button>
          {!query && (
            <button
              type="button"
              className="search__hint"
              aria-label="Open command palette"
              title="Command palette"
              onMouseDown={(event) => event.preventDefault()}
              onClick={openPalette}
            >
              {modCombo('K')}
            </button>
          )}
          {query && (
            <button
              type="button"
              className="search__clear"
              aria-label="Clear search"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                inputRef.current?.focus();
              }}
            >
              <X aria-hidden="true" />
            </button>
          )}
        </div>
        {spotifyWidget && <SpotifyPlayer />}
      </form>

      {panelOpen && (
        <div className="search__panel" id="search-suggestions" role="listbox">
          {!query && recents.length > 0 && (
            <div className="search__group-head">
              <span className="search__group-label">Recent</span>
              <button
                type="button"
                className="search__group-action"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  void clearRecentSearches();
                  setRecents([]);
                }}
              >
                Clear
              </button>
            </div>
          )}
          {items.map((item, index) => (
            <button
              key={item.id}
              id={`search-item-${index}`}
              type="button"
              className="search__suggestion"
              role="option"
              aria-selected={activeIndex === index}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => submit(item.value)}
            >
              {item.kind === 'recent' ? (
                <Clock3 aria-hidden="true" />
              ) : item.kind === 'search' ? (
                <ArrowUpRight aria-hidden="true" />
              ) : (
                <Search aria-hidden="true" />
              )}
              <span>
                {item.kind === 'search' ? (
                  <>
                    Search for <strong>{item.label}</strong>
                  </>
                ) : (
                  <Highlight text={item.label} query={query} />
                )}
              </span>
            </button>
          ))}
          {loading && !items.length && (
            <div className="search__loading">
              <Loader2 aria-hidden="true" /> Looking for suggestions…
            </div>
          )}
          <div className="search__footer" aria-hidden="true">
            <span>↑↓ navigate · Enter search</span>
            <span>{engineName}</span>
          </div>
        </div>
      )}

      {engineMenu && (
        <div className="search__engine-menu" role="menu" aria-label="Search engine">
          {ENGINE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className="engine-option"
              role="menuitemradio"
              aria-checked={engine === option.id}
              onClick={() => chooseEngine(option.id)}
            >
              <span className="engine-option__mark" aria-hidden="true">
                {option.short}
              </span>
              <span>{option.label}</span>
            </button>
          ))}
          <div className="search__engine-divider" />
          <button
            type="button"
            className="engine-option"
            role="menuitem"
            onClick={() => {
              setEngineMenu(false);
              openSettings('search');
            }}
          >
            <span className="engine-option__mark" aria-hidden="true">
              <Settings2 aria-hidden="true" style={{ width: 13, height: 13 }} />
            </span>
            <span>Search settings…</span>
          </button>
        </div>
      )}
    </div>
  );
}
