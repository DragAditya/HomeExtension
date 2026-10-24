import {
  ArrowRight,
  Info,
  Keyboard,
  Layers,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Type,
} from 'lucide-react';
import { modKey } from '../../../lib/platform';
import { useSettings } from '../../../store/settings';
import { useUI } from '../../../store/ui';

function version(): string {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
      return chrome.runtime.getManifest().version;
    }
  } catch {
    // Preview builds do not expose a manifest.
  }
  return '1.0.0';
}

const SHORTCUTS: Array<[string, string]> = [
  ['Mod K', 'Command palette'],
  ['/', 'Focus search'],
  ['Alt ,', 'Open settings'],
  ['Alt N', 'Open quick notes'],
  ['?', 'Keyboard help'],
  ['Esc', 'Close the top layer'],
  ['↑ / ↓', 'Move through suggestions'],
  ['Shift Enter', 'Open a shortcut in a new tab'],
  ['Alt ← / →', 'Reorder a focused shortcut'],
];

export function AboutSection() {
  const set = useSettings((state) => state.set);
  const openOnboarding = useUI((state) => state.openOnboarding);
  const openHelp = useUI((state) => state.openHelp);
  const closeSettings = useUI((state) => state.closeSettings);
  const resolved = SHORTCUTS.map(([keys, label]) => [keys.replace('Mod', modKey()), label]);

  return (
    <div className="settings-section">
      <div className="about-hero">
        <span className="about-hero__mark">
          <Sparkles aria-hidden="true" />
        </span>
        <div>
          <span className="settings-block__eyebrow">Lumen</span>
          <h2>A quieter place to begin.</h2>
          <p>
            A cinematic new tab built around one stage, one search field, and the few tools worth
            keeping close.
          </p>
          <div className="about-hero__meta">
            <span>Version {version()}</span>
            <span>Manifest V3</span>
            <span>Local-first</span>
          </div>
        </div>
      </div>

      <div className="about-actions">
        <button
          type="button"
          className="button"
          onClick={() => {
            closeSettings();
            window.setTimeout(openOnboarding, 120);
          }}
        >
          <RotateCcw aria-hidden="true" />
          Replay onboarding
        </button>
        <button type="button" className="button" onClick={openHelp}>
          <Keyboard aria-hidden="true" />
          All shortcuts
        </button>
      </div>

      <section className="settings-group">
        <div className="settings-group__head">
          <h3>Keyboard</h3>
          <p>Everything on the stage can be reached without leaving the keyboard.</p>
        </div>
        <div className="key-list">
          {resolved.map(([keys, label]) => (
            <div key={label} className="key-list__row">
              <span>{label}</span>
              <kbd>{keys}</kbd>
            </div>
          ))}
        </div>
      </section>

      <section className="settings-group">
        <div className="settings-group__head">
          <h3>Design & build</h3>
          <p>Hand-written CSS, semantic controls, and a single paused timeline of settings.</p>
        </div>
        <div className="about-facts">
          <div>
            <Layers aria-hidden="true" />
            <span>
              <strong>React 19 + Vite + TypeScript</strong>
              <small>No remote code, no runtime CDN.</small>
            </span>
          </div>
          <div>
            <Type aria-hidden="true" />
            <span>
              <strong>Manrope & Instrument Serif</strong>
              <small>Both licensed under the SIL Open Font License 1.1.</small>
            </span>
          </div>
          <div>
            <ShieldCheck aria-hidden="true" />
            <span>
              <strong>Permissions by necessity</strong>
              <small>Storage, identity, and only the hosts the widgets call.</small>
            </span>
          </div>
        </div>
      </section>

      <section className="settings-group">
        <div className="settings-group__head">
          <h3>Privacy</h3>
          <p>Plain language, no fine print.</p>
        </div>
        <p className="about-privacy">
          Lumen does not collect analytics, fingerprints, or browsing history. Search suggestions,
          weather, and Spotify requests go only to those services. Your settings, notes, and
          wallpapers stay on this device. There is no Lumen account and no sync service.
        </p>
        <button
          type="button"
          className="button button--small"
          onClick={() => set('onboarded', false)}
        >
          Mark onboarding incomplete
          <ArrowRight aria-hidden="true" />
        </button>
      </section>

      <div className="about-foot">
        <Info aria-hidden="true" />
        <span>Made for the first five seconds of your day.</span>
      </div>
    </div>
  );
}
