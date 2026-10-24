import {
  ArrowLeft,
  ArrowRight,
  Check,
  Command,
  Search,
  Settings2,
  Sparkles,
  StickyNote,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Dialog } from '../../components/ui/Dialog';
import { modCombo, modKey } from '../../lib/platform';
import { VIBES, VIBE_IDS } from '../../lib/vibes';
import { useSettings } from '../../store/settings';
import { useUI } from '../../store/ui';

const STEPS = ['Welcome', 'Make it yours', 'Keys'];

export function Onboarding() {
  const open = useUI((state) => state.onboardingOpen);
  const closeOnboarding = useUI((state) => state.closeOnboarding);
  const toast = useUI((state) => state.toast);
  const settings = useSettings((state) => state.settings);
  const set = useSettings((state) => state.set);
  const applyVibe = useSettings((state) => state.applyVibe);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(settings.profile.name);
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setName(settings.profile.name);
    const id = window.setTimeout(() => primaryRef.current?.focus(), 80);
    return () => window.clearTimeout(id);
    // Only reset when the tour opens, not on every settings keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const commitName = () => {
    const clean = name.trim();
    if (clean !== settings.profile.name) set('profile.name', clean);
  };

  const finish = (welcome: boolean) => {
    commitName();
    set('onboarded', true);
    closeOnboarding();
    if (welcome) toast(`Welcome to Lumen. Press ${modCombo('K')} to explore.`, 'success');
  };

  const next = () => {
    if (step === 1) commitName();
    if (step < 2) setStep(step + 1);
    else finish(true);
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        commitName();
        set('onboarded', true);
        closeOnboarding();
      }}
      className="dialog--onboarding"
      label="Welcome to Lumen"
    >
      <div className="onboarding">
        <header className="onboarding__head">
          <div className="onboarding__brand">
            <span className="onboarding__mark">
              <Sparkles aria-hidden="true" />
            </span>
            <span>Lumen</span>
          </div>
          <div className="onboarding__dots" aria-label={`Step ${step + 1} of 3`}>
            {STEPS.map((label, index) => (
              <span
                key={label}
                className={index === step ? 'onboarding__dot onboarding__dot--active' : 'onboarding__dot'}
              />
            ))}
          </div>
          <button
            type="button"
            className="onboarding__skip"
            onClick={() => finish(false)}
          >
            Skip tour
          </button>
          <button
            type="button"
            className="icon-button icon-button--ghost"
            aria-label="Close onboarding"
            onClick={() => finish(false)}
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="onboarding__body">
          {step === 0 && (
            <div className="onboarding__panel onboarding__panel--welcome">
              <span className="settings-block__eyebrow">Welcome</span>
              <h2>A quieter place to begin.</h2>
              <p className="onboarding__lede">
                One cinematic stage, one search field, and only the tools you choose. Everything is
                local, and everything is yours to shape.
              </p>

              <div className="onboarding-stage" aria-hidden="true">
                <div className="onboarding-stage__sky">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="onboarding-stage__search">
                  <Search />
                  <span>Search Google…</span>
                  <kbd>{modKey()} K</kbd>
                </div>
                <div className="onboarding-stage__tiles">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <div className="onboarding-stage__gear">
                  <Settings2 />
                </div>
              </div>

              <div className="onboarding__chips">
                <span>Search</span>
                <span>Shortcuts</span>
                <span>Wallpaper</span>
                <span>Focus</span>
                <span>Quick notes</span>
                <span>Spotify</span>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="onboarding__panel">
              <span className="settings-block__eyebrow">Make it yours</span>
              <h2>Set the mood.</h2>
              <p className="onboarding__lede">
                A Vibe tunes the theme, accent, wallpaper, and atmosphere together. Pick one now;
                every detail stays editable later.
              </p>

              <label className="onboarding__name">
                <span>What should we call you?</span>
                <input
                  value={name}
                  maxLength={40}
                  placeholder="Optional"
                  autoComplete="off"
                  onChange={(event) => setName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') next();
                  }}
                />
              </label>

              <div className="onboarding-vibes" role="group" aria-label="Choose a Vibe">
                {VIBE_IDS.map((id) => {
                  const vibe = VIBES[id];
                  const active = settings.appearance.vibe === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`onboarding-vibe ${active ? 'onboarding-vibe--active' : ''}`}
                      aria-pressed={active}
                      onClick={() => applyVibe(id)}
                    >
                      <span className="onboarding-vibe__swatch" data-vibe={id} aria-hidden="true">
                        <i />
                      </span>
                      <span>
                        <strong>{vibe.label}</strong>
                        <small>{vibe.blurb}</small>
                      </span>
                      {active && <Check aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="onboarding__panel">
              <span className="settings-block__eyebrow">Keys worth knowing</span>
              <h2>Everything is a keystroke away.</h2>
              <p className="onboarding__lede">
                The command palette searches the web and runs Lumen itself. The other keys are the
                ones you will use without thinking.
              </p>

              <div className="onboarding-keys">
                <div>
                  <span>
                    <Command aria-hidden="true" />
                  </span>
                  <kbd>{modCombo('K')}</kbd>
                  <strong>Command palette</strong>
                  <small>Search, settings, focus, Vibe, shortcuts</small>
                </div>
                <div>
                  <span>
                    <Search aria-hidden="true" />
                  </span>
                  <kbd>/</kbd>
                  <strong>Focus search</strong>
                  <small>Start typing from anywhere</small>
                </div>
                <div>
                  <span>
                    <Sparkles aria-hidden="true" />
                  </span>
                  <kbd>Alt ,</kbd>
                  <strong>Settings</strong>
                  <small>The full control center</small>
                </div>
                <div>
                  <span>
                    <StickyNote aria-hidden="true" />
                  </span>
                  <kbd>Alt N</kbd>
                  <strong>Quick notes</strong>
                  <small>Plain text, autosaved</small>
                </div>
              </div>

              <p className="onboarding__fineprint">
                Weather uses city search only. Spotify needs your own developer client ID. Lumen has
                no analytics, no remote code, and no account.
              </p>
            </div>
          )}
        </div>

        <footer className="onboarding__foot">
          <div className="onboarding__foot-left">
            {step > 0 ? (
              <button type="button" className="button button--small" onClick={() => setStep(step - 1)}>
                <ArrowLeft aria-hidden="true" />
                Back
              </button>
            ) : (
              <span className="onboarding__hint">Three short steps.</span>
            )}
          </div>
          <div className="onboarding__foot-right">
            <span className="onboarding__step-label">
              {step + 1} / {STEPS.length}
            </span>
            <button
              ref={primaryRef}
              type="button"
              className="button button--primary"
              onClick={next}
            >
              {step === 2 ? 'Enter Lumen' : 'Continue'}
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </footer>
      </div>
    </Dialog>
  );
}
