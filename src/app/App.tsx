import { useEffect, useRef } from 'react';
import { ToastViewport } from '../components/ui/Toast';
import { Clock } from '../features/clock/Clock';
import { DateLine } from '../features/clock/DateLine';
import { Greeting } from '../features/clock/Greeting';
import { HelpDialog } from '../features/help/HelpDialog';
import { NotesPanel } from '../features/notes/NotesPanel';
import { Onboarding } from '../features/onboarding/Onboarding';
import { CommandPalette } from '../features/palette/CommandPalette';
import { SearchBar } from '../features/search/SearchBar';
import { SettingsDrawer } from '../features/settings/SettingsDrawer';
import { Dock } from '../features/shell/Dock';
import { QuickActions } from '../features/shell/QuickActions';
import { TopRail } from '../features/shell/TopRail';
import { ShortcutGrid } from '../features/shortcuts/ShortcutGrid';
import { WallpaperLayer } from '../features/wallpaper/WallpaperLayer';
import { applyTheme, watchSystemTheme } from '../lib/theme';
import { useSettings } from '../store/settings';
import { useSpotify } from '../store/spotify';
import { useUI } from '../store/ui';

export function App() {
  const settings = useSettings((state) => state.settings);
  const migrated = useSettings((state) => state.migrated);
  const hydrated = useSettings((state) => state.hydrated);
  const toast = useUI((state) => state.toast);
  const openOnboarding = useUI((state) => state.openOnboarding);
  const announced = useRef(false);
  const onboardingBoot = useRef(false);
  const spotifyTokens = useSpotify((state) => state.tokens);
  const hydrateSpotify = useSpotify((state) => state.hydrate);
  const syncSpotify = useSpotify((state) => state.syncPlayer);

  useEffect(() => {
    applyTheme(settings);
  }, [settings]);

  useEffect(() => {
    if (settings.appearance.theme !== 'system') return;
    return watchSystemTheme(() => {
      applyTheme(useSettings.getState().settings);
    });
  }, [settings.appearance.theme]);

  useEffect(() => {
    if (!settings.appearance.timeShift) return;
    const id = window.setInterval(() => {
      applyTheme(useSettings.getState().settings);
    }, 60000);
    return () => window.clearInterval(id);
  }, [settings.appearance.timeShift]);

  useEffect(() => {
    if (!migrated || announced.current) return;
    announced.current = true;
    const id = window.setTimeout(() => {
      toast('Your Lumen setup was carried over.', 'success');
    }, 900);
    return () => window.clearTimeout(id);
  }, [migrated, toast]);

  useEffect(() => {
    if (!hydrated || onboardingBoot.current) return;
    onboardingBoot.current = true;
    if (!settings.onboarded) openOnboarding();
  }, [hydrated, openOnboarding, settings.onboarded]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return;
      const ui = useUI.getState();
      if (ui.onboardingOpen) return;

      const target = event.target as HTMLElement | null;
      const typing = Boolean(
        target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable),
      );
      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (mod && (key === 'k' || (event.shiftKey && key === 'p'))) {
        event.preventDefault();
        if (ui.paletteOpen) ui.closePalette();
        else ui.openPalette();
        return;
      }

      if (event.altKey && (event.code === 'Comma' || event.key === ',')) {
        event.preventDefault();
        if (ui.settingsOpen) ui.closeSettings();
        else ui.openSettings();
        return;
      }

      if (event.altKey && event.code === 'KeyN') {
        event.preventDefault();
        if (ui.notesOpen) ui.closeNotes();
        else ui.openNotes();
        return;
      }

      if (typing || mod || event.altKey) return;
      const dialogOpen = Boolean(document.querySelector('dialog[open]'));

      if (event.key === '/' && !dialogOpen) {
        const input = document.querySelector<HTMLInputElement>('.search__input');
        event.preventDefault();
        if (input) input.focus();
        else ui.openPalette();
        return;
      }

      if (event.key === '?' && !dialogOpen) {
        event.preventDefault();
        ui.openHelp();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    void hydrateSpotify();
  }, [hydrateSpotify]);

  useEffect(() => {
    if (!spotifyTokens) return;
    let timer = 0;
    const poll = () => {
      timer = 0;
      if (document.visibilityState !== 'visible') return;
      void syncSpotify();
      timer = window.setTimeout(poll, 5000);
    };
    poll();
    const onVisibility = () => {
      if (timer) {
        window.clearTimeout(timer);
        timer = 0;
      }
      if (document.visibilityState === 'visible') poll();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [spotifyTokens, syncSpotify]);

  const widgets = settings.layout.widgets;
  const hasStack = widgets.greeting || widgets.clock || widgets.date;
  const hasDock = widgets.focus || widgets.notes;

  return (
    <div className={`app ${hasDock ? 'app--with-dock' : ''}`}>
      <WallpaperLayer />
      <div className="ambient" aria-hidden="true" />
      <TopRail />

      <main className="stage">
        <div className="stage__inner">
          {hasStack && (
            <div className="stage__stack">
              {widgets.greeting && <Greeting />}
              {widgets.clock && <Clock />}
              {widgets.date && <DateLine />}
            </div>
          )}

          {widgets.search && (
            <div className="stage__search">
              <SearchBar />
            </div>
          )}

          {widgets.shortcuts && (
            <div className="stage__shortcuts">
              <ShortcutGrid />
            </div>
          )}
        </div>
      </main>

      <Dock />
      <QuickActions />
      <SettingsDrawer />
      <CommandPalette />
      <HelpDialog />
      <Onboarding />
      <NotesPanel />
      <ToastViewport />
    </div>
  );
}
