import { Pencil, Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import type { CSSProperties, DragEvent, KeyboardEvent } from 'react';
import { useSettings } from '../../store/settings';
import { useUI } from '../../store/ui';
import type { Shortcut } from '../../lib/settings/types';
import type { ShortcutInput } from '../../lib/favicon';
import { ShortcutDialog } from './ShortcutDialog';
import { ShortcutIcon } from './ShortcutIcon';

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `shortcut-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function ShortcutGrid() {
  const shortcuts = useSettings((state) => state.settings.shortcuts);
  const columns = useSettings((state) => state.settings.layout.shortcutColumns);
  const setShortcuts = useSettings((state) => state.setShortcuts);
  const toast = useUI((state) => state.toast);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Shortcut | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const dragging = useRef(false);

  const openUrl = (shortcut: Shortcut, newTab = false) => {
    if (dragging.current) return;
    if (newTab) {
      window.open(shortcut.url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.assign(shortcut.url);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (shortcut: Shortcut) => {
    setEditing(shortcut);
    setDialogOpen(true);
  };

  const save = (value: ShortcutInput, id?: string) => {
    if (id) {
      setShortcuts(
        shortcuts.map((shortcut) => (shortcut.id === id ? { ...shortcut, ...value } : shortcut)),
      );
      toast('Shortcut updated.', 'success');
      return;
    }
    if (shortcuts.length >= 16) {
      toast('The grid holds 16 shortcuts. Remove one first.', 'error');
      return;
    }
    setShortcuts([...shortcuts, { id: newId(), ...value }]);
    toast('Shortcut added.', 'success');
  };

  const remove = (id: string) => {
    setShortcuts(shortcuts.filter((shortcut) => shortcut.id !== id));
    toast('Shortcut removed.');
  };

  const reorder = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const from = shortcuts.findIndex((shortcut) => shortcut.id === fromId);
    const to = shortcuts.findIndex((shortcut) => shortcut.id === toId);
    if (from < 0 || to < 0) return;
    const next = [...shortcuts];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setShortcuts(next);
  };

  const moveByKeyboard = (id: string, direction: -1 | 1) => {
    const from = shortcuts.findIndex((shortcut) => shortcut.id === id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= shortcuts.length) return;
    const next = [...shortcuts];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setShortcuts(next);
    window.setTimeout(() => {
      document.querySelector<HTMLElement>(`[data-shortcut-id="${id}"]`)?.focus();
    }, 0);
  };

  const onTileKeyDown = (event: KeyboardEvent<HTMLDivElement>, shortcut: Shortcut) => {
    if (event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      moveByKeyboard(shortcut.id, event.key === 'ArrowLeft' ? -1 : 1);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openUrl(shortcut, event.shiftKey);
    }
  };

  const itemCount = shortcuts.length + (shortcuts.length < 16 ? 1 : 0);
  const effectiveColumns = Math.max(1, Math.min(columns, itemCount));
  const gridStyle = {
    '--shortcut-cols': effectiveColumns,
    maxWidth: `${effectiveColumns * 88 + Math.max(0, effectiveColumns - 1) * 18}px`,
  } as CSSProperties;

  return (
    <>
      <div
        className={`shortcut-grid ${shortcuts.length === 0 ? 'shortcut-grid--empty' : ''}`}
        style={gridStyle}
        aria-label="Shortcuts"
      >
        {shortcuts.map((shortcut) => (
          <div
            key={shortcut.id}
            data-shortcut-id={shortcut.id}
            className={`shortcut-tile ${dragId === shortcut.id ? 'shortcut-tile--dragging' : ''} ${
              overId === shortcut.id && dragId !== shortcut.id ? 'shortcut-tile--drop' : ''
            }`}
            role="link"
            tabIndex={0}
            draggable
            aria-label={`Open ${shortcut.name}. Shift+Enter opens a new tab.`}
            title={`${shortcut.name} — ${shortcut.url}`}
            onClick={() => openUrl(shortcut)}
            onKeyDown={(event) => onTileKeyDown(event, shortcut)}
            onDragStart={(event: DragEvent<HTMLDivElement>) => {
              dragging.current = true;
              setDragId(shortcut.id);
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/plain', shortcut.id);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              if (overId !== shortcut.id) setOverId(shortcut.id);
            }}
            onDragLeave={() => {
              if (overId === shortcut.id) setOverId(null);
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (dragId) reorder(dragId, shortcut.id);
              setDragId(null);
              setOverId(null);
            }}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
              window.setTimeout(() => {
                dragging.current = false;
              }, 80);
            }}
          >
            <span className="shortcut-tile__icon">
              <ShortcutIcon name={shortcut.name} url={shortcut.url} icon={shortcut.icon} />
            </span>
            <span className="shortcut-tile__name">{shortcut.name}</span>
            <button
              type="button"
              className="shortcut-edit"
              aria-label={`Edit ${shortcut.name}`}
              onClick={(event) => {
                event.stopPropagation();
                openEdit(shortcut);
              }}
            >
              <Pencil aria-hidden="true" style={{ width: 11, height: 11 }} />
            </button>
          </div>
        ))}

        {shortcuts.length < 16 && (
          <button
            type="button"
            className="shortcut-tile shortcut-tile--add"
            aria-label="Add shortcut"
            onClick={openAdd}
          >
            <span className="shortcut-tile__icon">
              <Plus aria-hidden="true" style={{ width: 18, height: 18 }} />
            </span>
            <span className="shortcut-tile__name">Add</span>
          </button>
        )}
      </div>

      <ShortcutDialog
        open={dialogOpen}
        shortcut={editing}
        onClose={() => setDialogOpen(false)}
        onSave={save}
        onDelete={remove}
      />
    </>
  );
}
