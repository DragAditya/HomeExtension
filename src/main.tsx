import '@fontsource-variable/manrope';
import '@fontsource/instrument-serif/latin-400-italic.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { loadSettings } from './lib/storage';
import { applyTheme } from './lib/theme';
import { useSettings } from './store/settings';
import './styles/tokens.css';
import './styles/base.css';
import './styles/wallpaper.css';
import './styles/glass.css';
import './styles/controls.css';
import './styles/search.css';
import './styles/shortcuts.css';
import './styles/weather.css';
import './styles/focus.css';
import './styles/notes.css';
import './styles/spotify.css';
import './styles/settings.css';
import './styles/palette.css';
import './styles/onboarding.css';
import './styles/motion.css';

async function boot() {
  const root = document.getElementById('root');
  if (!root) throw new Error('Lumen root element is missing');

  let settings;
  let migrated = false;
  try {
    const loaded = await loadSettings();
    settings = loaded.settings;
    migrated = loaded.migrated;
  } catch {
    const { cloneDefaults } = await import('./lib/settings/defaults');
    settings = cloneDefaults();
  }

  useSettings.getState().hydrateWith(settings, migrated);
  applyTheme(settings);

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void boot();
