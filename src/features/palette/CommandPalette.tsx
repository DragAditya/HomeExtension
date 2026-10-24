import {
  Blocks,
  Check,
  Database,
  Download,
  Grid2X2,
  Info,
  Keyboard,
  LayoutPanelTop,
  Music2,
  Pause,
  Play,
  Plug,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  StickyNote,
  SunMoon,
  Timer,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Dialog } from '../../components/ui/Dialog';
import { fuzzyScore } from '../../lib/fuzzy';
import { buildSearchUrl, SEARCH_ENGINES } from '../../lib/search';
import { addRecentSearch } from '../../lib/searchHistory';
import { SECTION_META } from '../../lib/settings/registry';
import type { SettingsSectionId } from '../../lib/settings/types';
import { SCENES, VIBES, VIBE_IDS } from '../../lib/vibes';
import { useFocus } from '../../store/focus';
import { useSettings } from '../../store/settings';
import { useUI } from '../../store/ui';
import { ShortcutIcon } from '../shortcuts/ShortcutIcon';

type PaletteItem = {
  id: string;
  group: 'Search' | 'Recent' | 'Actions' | 'Settings' | 'Shortcuts' | 'Vibes' | 'Wallpapers';
  label: string;
  detail?: string;
  keywords?: string;
  icon: ReactNode;
  hint?: string;
  remember?: boolean;
  run: () => void;
};

const RECENT_KEY = 'lumen.palette.recent';
const GROUP_ORDER: PaletteItem['group'][] = [
  'Search',
  'Recent',
  'Actions',
  'Settings',
  'Shortcuts',
  'Vibes',
  'Wallpapers',
];

const SECTION_ICONS: Record<SettingsSectionId, ReactNode> = {
  appearance: <Sparkles aria-hidden="true" />,
  layout: <LayoutPanelTop aria-hidden="true" />,
  search: <Search aria-hidden="true" />,
  shortcuts: <Grid2X2 aria-hidden="true" />,
  widgets: <Blocks aria-hidden="true" />,
  integrations: <Plug aria-hidden="true" />,
  data: <Database aria-hidden="true" />,
  about: <Info aria-hidden="true" />,
};

function readRecent(): string[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((entry) => typeof entry === 'string').slice(0, 5) : [];
  } catch {
    return [];
  }
}

function remember(id: string): void {
  try {
    const next = [id, ...readRecent().filter((entry) => entry !== id)].slice(0, 5);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Recent commands are a convenience; the palette still works without them.
  }
}

export function CommandPalette() {
  const open = useUI((state) => state.paletteOpen);
  const closePalette = useUI((state) => state.closePalette);
  const openSettings = useUI((state) => state.openSettings);
  const openNotes = useUI((state) => state.openNotes);
  const openHelp = useUI((state) => state.openHelp);
  const settings = useSettings((state) => state.settings);
  const set = useSettings((state) => state.set);
  const applyVibe = useSettings((state) => state.applyVibe);
  const focus = useFocus((state) => state.state);
  const toggleFocus = useFocus((state) => state.toggle);
  const resetFocus = useFocus((state) => state.reset);
  const focusHydrate = useFocus((state) => state.hydrate);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    void focusHydrate();
    const id = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(id);
  }, [focusHydrate, open]);

  const items = useMemo<PaletteItem[]>(() => {
    const list: PaletteItem[] = [];
    const nextTheme =
      settings.appearance.theme === 'light'
        ? 'dark'
        : settings.appearance.theme === 'dark'
          ? 'light'
          : window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'light'
            : 'dark';

    list.push({
      id: 'action:theme',
      group: 'Actions',
      label: `Switch to ${nextTheme} theme`,
      detail: 'Appearance',
      keywords: 'theme dark light appearance mode',
      icon: <SunMoon aria-hidden="true" />,
      run: () => set('appearance.theme', nextTheme),
    });
    list.push({
      id: 'action:focus',
      group: 'Actions',
      label: focus.status === 'running' ? 'Pause focus timer' : 'Start focus timer',
      detail: `${focus.mode === 'work' ? 'Focus' : 'Break'} · ${settings.widgets.focus.workMinutes}/${settings.widgets.focus.breakMinutes}`,
      keywords: 'focus timer pomodoro start pause break work',
      icon:
        focus.status === 'running' ? (
          <Pause aria-hidden="true" />
        ) : (
          <Play aria-hidden="true" />
        ),
      run: toggleFocus,
    });
    list.push({
      id: 'action:focus-reset',
      group: 'Actions',
      label: 'Reset focus timer',
      detail: 'Back to the top of this phase',
      keywords: 'focus timer reset restart pomodoro',
      icon: <Timer aria-hidden="true" />,
      run: resetFocus,
    });
    list.push({
      id: 'action:notes',
      group: 'Actions',
      label: 'Open quick notes',
      detail: settings.widgets.notes.text.trim() ? 'Pick up where you left off' : 'Start a thought',
      keywords: 'notes notepad write quick alt n',
      icon: <StickyNote aria-hidden="true" />,
      hint: 'Alt N',
      run: openNotes,
    });
    list.push({
      id: 'action:help',
      group: 'Actions',
      label: 'Show keyboard shortcuts',
      detail: 'Every key on the stage',
      keywords: 'keyboard help keys shortcuts',
      icon: <Keyboard aria-hidden="true" />,
      hint: '?',
      run: openHelp,
    });
    list.push({
      id: 'action:shortcuts',
      group: 'Actions',
      label: 'Manage shortcut tiles',
      detail: 'Add, edit, and reorder',
      keywords: 'shortcuts tiles add edit manage links',
      icon: <Grid2X2 aria-hidden="true" />,
      run: () => openSettings('shortcuts'),
    });
    list.push({
      id: 'action:backup',
      group: 'Actions',
      label: 'Back up Lumen',
      detail: 'Export a readable JSON file',
      keywords: 'backup export download data settings',
      icon: <Download aria-hidden="true" />,
      run: () => openSettings('data'),
    });
    list.push({
      id: 'action:spotify',
      group: 'Actions',
      label: 'Spotify settings',
      detail: 'Connection, client ID, redirect URI',
      keywords: 'spotify music connect oauth playback',
      icon: <Music2 aria-hidden="true" />,
      run: () => openSettings('integrations'),
    });

    for (const id of Object.keys(SECTION_META) as SettingsSectionId[]) {
      list.push({
        id: `settings:${id}`,
        group: 'Settings',
        label: `${SECTION_META[id].label} settings`,
        detail: SECTION_META[id].description,
        keywords: `settings open ${SECTION_META[id].label} ${SECTION_META[id].description}`,
        icon: SECTION_ICONS[id],
        run: () => openSettings(id),
      });
    }

    for (const shortcut of settings.shortcuts) {
      list.push({
        id: `shortcut:${shortcut.id}`,
        group: 'Shortcuts',
        label: shortcut.name,
        detail: shortcut.url,
        keywords: `shortcut open ${shortcut.name} ${shortcut.url}`,
        icon: <ShortcutIcon name={shortcut.name} url={shortcut.url} icon={shortcut.icon} />,
        run: () => window.location.assign(shortcut.url),
      });
    }

    for (const id of VIBE_IDS) {
      const vibe = VIBES[id];
      list.push({
        id: `vibe:${id}`,
        group: 'Vibes',
        label: `Vibe: ${vibe.label}`,
        detail: vibe.blurb,
        keywords: `vibe theme mood look ${vibe.label} ${vibe.blurb}`,
        icon: <span className="palette-dot" data-vibe={id} aria-hidden="true" />,
        run: () => applyVibe(id),
      });
    }

    for (const scene of SCENES) {
      list.push({
        id: `scene:${scene.id}`,
        group: 'Wallpapers',
        label: scene.label,
        detail: 'Scene wallpaper',
        keywords: `wallpaper scene background ${scene.label}`,
        icon: <span className="palette-dot" data-scene-dot={scene.id} aria-hidden="true" />,
        run: () => set('appearance.wallpaper', { kind: 'scene', scene: scene.id }),
      });
    }

    return list;
  }, [applyVibe, focus.mode, focus.status, openHelp, openNotes, openSettings, resetFocus, set, settings]);

  const queryTrimmed = query.trim();
  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  const grouped = useMemo(() => {
    const groups = new Map<PaletteItem['group'], PaletteItem[]>();
    const add = (group: PaletteItem['group'], entries: PaletteItem[]) => {
      if (entries.length > 0) groups.set(group, entries);
    };

    if (queryTrimmed) {
      const searchItem: PaletteItem = {
        id: `search:${queryTrimmed}`,
        group: 'Search',
        label: `Search for “${queryTrimmed}”`,
        detail:
          settings.search.engine === 'custom'
            ? settings.search.customEngine.name || 'Custom engine'
            : SEARCH_ENGINES[settings.search.engine].label,
        keywords: `search web query ${queryTrimmed}`,
        icon: <Search aria-hidden="true" />,
        remember: false,
        run: () => {
          const url = buildSearchUrl(
            settings.search.engine,
            queryTrimmed,
            settings.search.customEngine,
          );
          void addRecentSearch(queryTrimmed);
          window.location.assign(url);
        },
      };
      add('Search', [searchItem]);
    } else {
      const recentItems = readRecent()
        .slice(0, 3)
        .map((id) => itemsById.get(id))
        .filter((item): item is PaletteItem => Boolean(item));
      add('Recent', recentItems);
    }

    for (const group of GROUP_ORDER) {
      if (group === 'Search' || group === 'Recent') continue;
      if (!queryTrimmed && group !== 'Actions') continue;
      const scored = items
        .filter((item) => item.group === group)
        .map((item) => {
          if (!queryTrimmed) return { item, score: 0 };
          const score = Math.max(
            fuzzyScore(item.label, queryTrimmed) ?? -1,
            fuzzyScore(item.keywords ?? '', queryTrimmed) !== null
              ? (fuzzyScore(item.keywords ?? '', queryTrimmed) ?? 0) - 12
              : -1,
            fuzzyScore(item.detail ?? '', queryTrimmed) !== null
              ? (fuzzyScore(item.detail ?? '', queryTrimmed) ?? 0) - 18
              : -1,
          );
          return { item, score };
        })
        .filter((entry) => entry.score >= 0)
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.item);
      add(
        group,
        scored.slice(
          0,
          group === 'Actions' ? 10 : group === 'Shortcuts' ? 8 : group === 'Settings' ? 8 : 6,
        ),
      );
    }

    return [...groups.entries()].map(([group, entries]) => ({ group, entries }));
  }, [items, itemsById, queryTrimmed, settings.search.customEngine, settings.search.engine]);

  const flat = useMemo(() => grouped.flatMap((group) => group.entries), [grouped]);

  useEffect(() => {
    setActiveIndex(0);
  }, [queryTrimmed]);

  useEffect(() => {
    if (activeIndex >= flat.length) setActiveIndex(Math.max(0, flat.length - 1));
  }, [activeIndex, flat.length]);

  useEffect(() => {
    if (!open) return;
    const element = document.querySelector<HTMLElement>(`[data-palette-index="${activeIndex}"]`);
    element?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const run = (item: PaletteItem) => {
    if (item.remember !== false) remember(item.id);
    closePalette();
    item.run();
  };

  let renderIndex = -1;
  let previousGroup: PaletteItem['group'] | null = null;

  return (
    <Dialog open={open} onClose={closePalette} className="dialog--palette" label="Command palette">
      <div className="palette">
        <div className="palette__search">
          <Search aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            placeholder="Search the web, jump to a setting, or run a command…"
            aria-label="Command palette"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-autocomplete="list"
            aria-activedescendant={flat[activeIndex] ? `palette-${flat[activeIndex].id}` : undefined}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                if (!flat.length) return;
                setActiveIndex((current) => (current + 1) % flat.length);
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                if (!flat.length) return;
                setActiveIndex((current) => (current - 1 + flat.length) % flat.length);
              } else if (event.key === 'Enter') {
                event.preventDefault();
                const item = flat[activeIndex];
                if (item) run(item);
              } else if (event.key === 'Escape' && query) {
                event.preventDefault();
                event.stopPropagation();
                setQuery('');
              }
            }}
          />
          <span className="palette__esc">Esc</span>
        </div>

        <div className="palette__results" id="palette-results" role="listbox" aria-label="Commands">
          {flat.length === 0 ? (
            <div className="palette__empty">
              <Search aria-hidden="true" />
              <strong>No matches</strong>
              <span>Try a shortcut name, “focus”, “theme”, or a setting.</span>
            </div>
          ) : (
            flat.map((item) => {
              renderIndex += 1;
              const index = renderIndex;
              const heading = previousGroup !== item.group ? item.group : null;
              previousGroup = item.group;
              return (
                <div key={item.id}>
                  {heading && (
                    <div className="palette__group">
                      <span>{heading}</span>
                      {heading === 'Recent' && (
                        <small>{readRecent().length} remembered</small>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    id={`palette-${item.id}`}
                    data-palette-index={index}
                    className={`palette__item ${index === activeIndex ? 'palette__item--active' : ''}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => run(item)}
                  >
                    <span className="palette__icon">{item.icon}</span>
                    <span className="palette__copy">
                      <strong>{item.label}</strong>
                      {item.detail && <small>{item.detail}</small>}
                    </span>
                    {item.hint && <kbd>{item.hint}</kbd>}
                    {index === activeIndex && <Check aria-hidden="true" className="palette__enter" />}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <footer className="palette__foot" aria-hidden="true">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> run
          </span>
          <span>
            <kbd>Esc</kbd> close
          </span>
          <span className="palette__foot-brand">
            <SlidersHorizontal aria-hidden="true" /> Lumen
          </span>
        </footer>
      </div>
    </Dialog>
  );
}
