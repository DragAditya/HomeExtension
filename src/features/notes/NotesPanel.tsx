import { Check, Copy, Download, StickyNote, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ConfirmButton } from '../../components/ui/ConfirmButton';
import { Dialog } from '../../components/ui/Dialog';
import { useSettings } from '../../store/settings';
import { useUI } from '../../store/ui';

export function NotesPanel() {
  const open = useUI((state) => state.notesOpen);
  const closeNotes = useUI((state) => state.closeNotes);
  const stored = useSettings((state) => state.settings.widgets.notes.text);
  const set = useSettings((state) => state.set);
  const toast = useUI((state) => state.toast);
  const [draft, setDraft] = useState(stored);
  const [status, setStatus] = useState<'saved' | 'saving'>('saved');

  useEffect(() => {
    if (!open) return;
    setDraft(stored);
    setStatus('saved');
  }, [open, stored]);

  useEffect(() => {
    if (!open) return;
    if (draft === stored) {
      setStatus('saved');
      return;
    }
    setStatus('saving');
    const id = window.setTimeout(() => {
      set('widgets.notes.text', draft);
      setStatus('saved');
    }, 280);
    return () => window.clearTimeout(id);
  }, [draft, open, set, stored]);

  const flush = () => {
    if (draft !== stored) set('widgets.notes.text', draft);
  };

  const words = draft.trim() ? draft.trim().split(/\s+/).length : 0;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      toast('Notes copied.', 'success');
    } catch {
      toast('Could not copy notes.', 'error');
    }
  };

  const download = () => {
    const blob = new Blob([draft], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `lumen-notes-${new Date().toISOString().slice(0, 10)}.txt`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Notes downloaded.', 'success');
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        flush();
        closeNotes();
      }}
      className="dialog--notes"
      label="Quick notes"
    >
      <div className="notes-panel">
        <header className="notes-panel__head">
          <div className="notes-panel__title">
            <span className="notes-panel__mark">
              <StickyNote aria-hidden="true" />
            </span>
            <div>
              <h2 className="dialog__title">Quick notes</h2>
              <p className="dialog__description">Saved on this device, as you type.</p>
            </div>
          </div>
          <button
            type="button"
            className="icon-button icon-button--ghost"
            aria-label="Close notes"
            title="Close notes (Esc)"
            onClick={() => {
              flush();
              closeNotes();
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 16, lineHeight: 1 }}>
              ×
            </span>
          </button>
        </header>

        <textarea
          className="notes-panel__editor"
          value={draft}
          placeholder="A thought, a link, a line of code…"
          aria-label="Quick notes"
          autoFocus
          spellCheck
          onChange={(event) => setDraft(event.target.value)}
          onBlur={flush}
        />

        <footer className="notes-panel__foot">
          <div className="notes-panel__meta">
            <span className="notes-panel__status">
              {status === 'saved' ? (
                <>
                  <Check aria-hidden="true" /> Saved
                </>
              ) : (
                'Saving…'
              )}
            </span>
            <span>
              {words} {words === 1 ? 'word' : 'words'} · {draft.length} chars
            </span>
          </div>
          <div className="notes-panel__actions">
            <button
              type="button"
              className="button button--small"
              disabled={!draft}
              onClick={() => void copy()}
            >
              <Copy aria-hidden="true" />
              Copy
            </button>
            <button
              type="button"
              className="button button--small"
              disabled={!draft}
              onClick={download}
            >
              <Download aria-hidden="true" />
              .txt
            </button>
            <ConfirmButton
              className="button button--small button--danger"
              confirmLabel="Clear notes?"
              disabled={!draft}
              onConfirm={() => {
                setDraft('');
                set('widgets.notes.text', '');
              }}
            >
              <Trash2 aria-hidden="true" />
              Clear
            </ConfirmButton>
          </div>
        </footer>
      </div>
    </Dialog>
  );
}
