import { StickyNote } from 'lucide-react';
import { FocusTimer } from '../../features/focus/FocusTimer';
import { useSettings } from '../../store/settings';
import { useUI } from '../../store/ui';

export function Dock() {
  const focus = useSettings((state) => state.settings.layout.widgets.focus);
  const notes = useSettings((state) => state.settings.layout.widgets.notes);
  const notesText = useSettings((state) => state.settings.widgets.notes.text);
  const openNotes = useUI((state) => state.openNotes);

  if (!focus && !notes) return null;

  return (
    <footer className="dock" aria-label="Quick tools">
      {focus && <FocusTimer />}
      {focus && notes && <span className="dock__divider" aria-hidden="true" />}
      {notes && (
        <button
          type="button"
          className="dock__notes"
          title="Open quick notes (Alt+N)"
          onClick={openNotes}
        >
          <StickyNote aria-hidden="true" />
          <span>Notes</span>
          {notesText.trim() && <span className="dock__notes-dot" aria-label="Notes have content" />}
        </button>
      )}
    </footer>
  );
}
