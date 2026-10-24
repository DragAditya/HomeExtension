import { Command, Keyboard, Search, Sparkles, X } from 'lucide-react';
import { Dialog } from '../../components/ui/Dialog';
import { modCombo, modKey } from '../../lib/platform';
import { useUI } from '../../store/ui';

const GROUPS: Array<{ title: string; blurb: string; keys: Array<[string, string]> }> = [
  {
    title: 'Everywhere',
    blurb: 'The stage stays within reach.',
    keys: [
      ['Mod K', 'Command palette'],
      ['/', 'Focus search'],
      ['Alt ,', 'Open settings'],
      ['Alt N', 'Quick notes'],
      ['?', 'This card'],
      ['Esc', 'Close the top layer'],
    ],
  },
  {
    title: 'Search',
    blurb: 'Move without the mouse.',
    keys: [
      ['↑ / ↓', 'Move through suggestions'],
      ['Enter', 'Search'],
      ['Esc', 'Clear the query'],
      ['Mod K', 'Search or run a command'],
    ],
  },
  {
    title: 'Shortcut tiles',
    blurb: 'A row you can rearrange.',
    keys: [
      ['Enter', 'Open the tile'],
      ['Shift Enter', 'Open in a new tab'],
      ['Alt ← / →', 'Reorder the focused tile'],
      ['Tab', 'Move between tiles'],
    ],
  },
  {
    title: 'Space & tools',
    blurb: 'The quieter half of the stage.',
    keys: [
      ['Alt N', 'Quick notes'],
      ['Esc', 'Close notes'],
      ['Tab', 'Move through dock controls'],
      ['Space / Enter', 'Activate a focused control'],
    ],
  },
];

export function HelpDialog() {
  const open = useUI((state) => state.helpOpen);
  const closeHelp = useUI((state) => state.closeHelp);
  const openPalette = useUI((state) => state.openPalette);
  const resolve = (key: string) => key.replace('Mod', modKey());

  return (
    <Dialog open={open} onClose={closeHelp} className="dialog--help" label="Keyboard shortcuts">
      <div className="help-dialog">
        <header className="help-dialog__head">
          <span className="help-dialog__mark">
            <Keyboard aria-hidden="true" />
          </span>
          <div className="help-dialog__title">
            <span className="settings-block__eyebrow">Lumen</span>
            <h2 className="dialog__title">Keyboard & shortcuts</h2>
            <p className="dialog__description">
              Everything important is one keystroke away. The palette is the front door.
            </p>
          </div>
          <button
            type="button"
            className="icon-button icon-button--ghost"
            aria-label="Close shortcuts"
            title="Close (Esc)"
            onClick={closeHelp}
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="help-dialog__callout">
          <span>
            <Sparkles aria-hidden="true" />
          </span>
          <p>
            Press <kbd>{modCombo('K')}</kbd> to search the web, open any setting, change Vibe, or run
            a focus timer without leaving the keyboard.
          </p>
          <button
            type="button"
            className="button button--small button--primary"
            onClick={() => {
              closeHelp();
              window.setTimeout(openPalette, 80);
            }}
          >
            <Command aria-hidden="true" />
            Open palette
          </button>
        </div>

        <div className="help-grid">
          {GROUPS.map((group) => (
            <section key={group.title} className="help-group">
              <div className="help-group__head">
                <h3>{group.title}</h3>
                <p>{group.blurb}</p>
              </div>
              <div className="help-keys">
                {group.keys.map(([keys, label]) => (
                  <div key={`${group.title}-${label}`} className="help-keys__row">
                    <span>{label}</span>
                    <kbd>{resolve(keys)}</kbd>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="help-dialog__foot">
          <Search aria-hidden="true" />
          <span>Tip: open settings to change the search engine, dock, and every widget.</span>
        </footer>
      </div>
    </Dialog>
  );
}
