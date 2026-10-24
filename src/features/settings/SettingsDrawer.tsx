import {
  Blocks,
  Database,
  Grid2X2,
  Info,
  LayoutPanelTop,
  Plug,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmButton } from '../../components/ui/ConfirmButton';
import { Dialog } from '../../components/ui/Dialog';
import { Toggle } from '../../components/ui/Toggle';
import {
  SECTION_META,
  SETTINGS_REGISTRY,
  settingsForSection,
} from '../../lib/settings/registry';
import type { SettingsSectionId } from '../../lib/settings/types';
import { useSettings } from '../../store/settings';
import { useUI } from '../../store/ui';
import { SettingControl } from './controls/SettingControl';
import { AboutSection } from './sections/AboutSection';
import { AppearanceSection } from './sections/AppearanceSection';
import { DataSection } from './sections/DataSection';
import { IntegrationsSection } from './sections/IntegrationsSection';
import { LayoutSection } from './sections/LayoutSection';
import { SearchSection } from './sections/SearchSection';
import { ShortcutManager } from './sections/ShortcutManager';
import { WidgetsSection } from './sections/WidgetsSection';

const SECTION_ICONS: Record<SettingsSectionId, typeof Sparkles> = {
  appearance: Sparkles,
  layout: LayoutPanelTop,
  search: Search,
  shortcuts: Grid2X2,
  widgets: Blocks,
  integrations: Plug,
  data: Database,
  about: Info,
};

const SECTIONS = Object.keys(SECTION_META) as SettingsSectionId[];

const SEARCH_JUMPS: Array<{
  label: string;
  detail: string;
  section: SettingsSectionId;
  keywords: string;
}> = [
  {
    label: 'Vibe & wallpaper',
    detail: 'Change the mood of the whole stage.',
    section: 'appearance',
    keywords: 'vibe theme wallpaper scene accent look',
  },
  {
    label: 'Widgets & dock',
    detail: 'Choose what appears on the stage.',
    section: 'layout',
    keywords: 'widgets dock weather spotify focus notes layout order',
  },
  {
    label: 'Weather city & units',
    detail: 'Set a city without sharing your location.',
    section: 'widgets',
    keywords: 'weather forecast city temperature units degrees location',
  },
  {
    label: 'Spotify connection',
    detail: 'Client ID, redirect URI, playback.',
    section: 'integrations',
    keywords: 'spotify music oauth connect client redirect playback',
  },
  {
    label: 'Backup & reset',
    detail: 'Export a file, import it later, or start over.',
    section: 'data',
    keywords: 'backup export import reset storage privacy clear',
  },
  {
    label: 'Shortcut tiles',
    detail: 'Add, edit, and reorder shortcuts.',
    section: 'shortcuts',
    keywords: 'shortcuts tiles grid links add edit reorder',
  },
  {
    label: 'Keyboard',
    detail: 'Every key on the stage.',
    section: 'about',
    keywords: 'keyboard keys hotkeys shortcuts help',
  },
];

function SectionBody({ section }: { section: SettingsSectionId }) {
  switch (section) {
    case 'appearance':
      return <AppearanceSection />;
    case 'layout':
      return <LayoutSection />;
    case 'search':
      return <SearchSection />;
    case 'shortcuts':
      return <ShortcutManager />;
    case 'widgets':
      return <WidgetsSection />;
    case 'integrations':
      return <IntegrationsSection />;
    case 'data':
      return <DataSection />;
    case 'about':
      return <AboutSection />;
    default:
      return null;
  }
}

export function SettingsDrawer() {
  const open = useUI((state) => state.settingsOpen);
  const closeSettings = useUI((state) => state.closeSettings);
  const section = useUI((state) => state.settingsSection);
  const setSection = useUI((state) => state.setSettingsSection);
  const advanced = useUI((state) => state.advanced);
  const toggleAdvanced = useUI((state) => state.toggleAdvanced);
  const toast = useUI((state) => state.toast);
  const settings = useSettings((state) => state.settings);
  const resetSection = useSettings((state) => state.resetSection);
  const searchRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [saveState, setSaveState] = useState<'saved' | 'saving'>('saved');
  const previousSettings = useRef(settings);

  useEffect(() => {
    if (previousSettings.current === settings) return;
    previousSettings.current = settings;
    setSaveState('saving');
    const id = window.setTimeout(() => setSaveState('saved'), 640);
    return () => window.clearTimeout(id);
  }, [settings]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const id = window.setTimeout(() => searchRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [query, section]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return SETTINGS_REGISTRY.filter((meta) => {
      if (meta.advanced && !advanced) return false;
      const haystack = [
        meta.label,
        meta.help ?? '',
        meta.path,
        SECTION_META[meta.section].label,
        ...(meta.keywords ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [advanced, query]);

  const jumps = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return SEARCH_JUMPS.filter((jump) =>
      `${jump.label} ${jump.detail} ${jump.keywords}`.toLowerCase().includes(needle),
    );
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<SettingsSectionId, typeof results>();
    for (const meta of results) {
      const existing = map.get(meta.section) ?? [];
      existing.push(meta);
      map.set(meta.section, existing);
    }
    return map;
  }, [results]);

  const activeMeta = SECTION_META[section];
  const ActiveIcon = SECTION_ICONS[section];
  const searching = query.trim().length > 0;
  const canReset =
    section === 'shortcuts' ||
    section === 'appearance' ||
    settingsForSection(section).length > 0;

  return (
    <Dialog
      open={open}
      onClose={closeSettings}
      className="dialog--settings"
      label="Lumen settings"
    >
      <div className="settings-drawer">
        <header className="settings-head">
          <div className="settings-head__title">
            <span className="settings-head__mark">
              <SlidersHorizontal aria-hidden="true" />
            </span>
            <div>
              <span className="settings-head__eyebrow">Lumen</span>
              <h1>Settings</h1>
            </div>
          </div>
          <div className={`settings-save settings-save--${saveState}`} aria-live="polite">
            <span />
            {saveState === 'saving' ? 'Saving' : 'Saved'}
          </div>
          <button
            type="button"
            className="icon-button icon-button--ghost settings-head__close"
            aria-label="Close settings"
            title="Close settings (Esc)"
            onClick={closeSettings}
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="settings-search">
          <Search aria-hidden="true" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            placeholder="Find a setting…"
            aria-label="Search settings"
            spellCheck={false}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && query) {
                event.stopPropagation();
                event.preventDefault();
                setQuery('');
              }
            }}
          />
          {query && (
            <button
              type="button"
              className="settings-search__clear"
              aria-label="Clear settings search"
              onClick={() => {
                setQuery('');
                searchRef.current?.focus();
              }}
            >
              <X aria-hidden="true" />
            </button>
          )}
          <kbd className="settings-search__hint">/</kbd>
        </div>

        <nav className="settings-tabs" aria-label="Settings sections">
          {SECTIONS.map((id) => {
            const Icon = SECTION_ICONS[id];
            const active = id === section;
            return (
              <button
                key={id}
                type="button"
                className={`settings-tab ${active && !searching ? 'settings-tab--active' : ''}`}
                aria-current={active && !searching ? 'page' : undefined}
                onClick={() => {
                  setQuery('');
                  setSection(id);
                }}
              >
                <Icon aria-hidden="true" />
                <span>{SECTION_META[id].label}</span>
              </button>
            );
          })}
        </nav>

        <div className="settings-scroll" ref={scrollRef}>
          {searching ? (
            <div className="settings-results">
              <div className="settings-results__head">
                <div>
                  <span className="settings-results__eyebrow">Search</span>
                  <h2>
                    {results.length + jumps.length > 0
                      ? `${results.length + jumps.length} result${
                          results.length + jumps.length === 1 ? '' : 's'
                        }`
                      : 'No matches'}
                  </h2>
                </div>
                <span className="settings-results__query">“{query.trim()}”</span>
              </div>

              {jumps.length > 0 && (
                <section className="settings-jumps">
                  <h3>Go to</h3>
                  <div className="settings-jumps__list">
                    {jumps.map((jump) => {
                      const Icon = SECTION_ICONS[jump.section];
                      return (
                        <button
                          key={jump.label}
                          type="button"
                          className="settings-jump"
                          onClick={() => {
                            setQuery('');
                            setSection(jump.section);
                          }}
                        >
                          <span className="settings-jump__icon">
                            <Icon aria-hidden="true" />
                          </span>
                          <span>
                            <strong>{jump.label}</strong>
                            <small>{jump.detail}</small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {[...grouped.entries()].map(([group, entries]) => (
                <section key={group} className="settings-result-group">
                  <button
                    type="button"
                    className="settings-result-group__head"
                    onClick={() => {
                      setQuery('');
                      setSection(group);
                    }}
                  >
                    <span>{SECTION_META[group].label}</span>
                    <small>Open section</small>
                  </button>
                  <div className="settings-group__body settings-group__body--flat">
                    {entries.map((meta) => (
                      <div className="setting-row" key={meta.path}>
                        <div className="setting-row__copy">
                          <span className="setting-row__label">{meta.label}</span>
                          {meta.help && <div className="setting-row__help">{meta.help}</div>}
                        </div>
                        <div className="setting-row__control">
                          <SettingControl path={meta.path} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              {results.length === 0 && jumps.length === 0 && (
                <div className="settings-empty">
                  <Search aria-hidden="true" />
                  <strong>Nothing found</strong>
                  <span>Try “wallpaper”, “focus”, “privacy”, or a shortcut key.</span>
                  <button type="button" className="button button--small" onClick={() => setQuery('')}>
                    Clear search
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <header className="settings-section-head">
                <div className="settings-section-head__copy">
                  <span className="settings-section-head__icon">
                    <ActiveIcon aria-hidden="true" />
                  </span>
                  <div>
                    <span className="settings-section-head__eyebrow">Control center</span>
                    <h2>{activeMeta.label}</h2>
                    <p>{activeMeta.description}</p>
                  </div>
                </div>
                {canReset && (
                  <ConfirmButton
                    className="button button--small"
                    confirmLabel="Reset this section?"
                    title={`Reset ${activeMeta.label}`}
                    onConfirm={() => {
                      resetSection(section);
                      toast(`${activeMeta.label} restored to defaults.`, 'success');
                    }}
                  >
                    Reset
                  </ConfirmButton>
                )}
              </header>

              <SectionBody section={section} />
            </>
          )}
        </div>

        <footer className="settings-foot">
          <div className="settings-foot__advanced">
            <span className="settings-foot__advanced-icon">
              <SlidersHorizontal aria-hidden="true" />
            </span>
            <div>
              <strong>Advanced mode</strong>
              <span>Surface overrides and storage detail</span>
            </div>
            <Toggle checked={advanced} onChange={toggleAdvanced} label="Advanced mode" />
          </div>
          <span className="settings-foot__privacy">Local only · No analytics</span>
        </footer>
      </div>
    </Dialog>
  );
}
