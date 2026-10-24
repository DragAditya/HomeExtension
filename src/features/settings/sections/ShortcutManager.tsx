import { ArrowDown, ArrowUp, GripVertical, Pencil, Plus, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { ConfirmButton } from '../../../components/ui/ConfirmButton';
import { validateShortcutInput, type ShortcutInput } from '../../../lib/favicon';
import { cloneDefaultShortcuts } from '../../../lib/settings/defaults';
import type { Shortcut } from '../../../lib/settings/types';
import { useSettings } from '../../../store/settings';
import { useUI } from '../../../store/ui';
import { ShortcutDialog } from '../../shortcuts/ShortcutDialog';
import { ShortcutIcon } from '../../shortcuts/ShortcutIcon';

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `shortcut-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function ShortcutManager() {
  const shortcuts = useSettings((state) => state.settings.shortcuts);
  const setShortcuts = useSettings((state) => state.setShortcuts);
  const toast = useUI((state) => state.toast);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Shortcut | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const shift = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= shortcuts.length) return;
    const next = [...shortcuts];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    setShortcuts(next);
  };

  const reorder = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const from = shortcuts.findIndex((entry) => entry.id === fromId);
    const to = shortcuts.findIndex((entry) => entry.id === toId);
    if (from < 0 || to < 0) return;
    const next = [...shortcuts];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setShortcuts(next);
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
      toast('The grid holds 16 shortcuts.', 'error');
      return;
    }
    const validated = validateShortcutInput(value);
    if (!validated.ok) return;
    setShortcuts([...shortcuts, { id: newId(), ...validated.value }]);
    toast('Shortcut added.', 'success');
  };

  return (
    <div className="shortcut-manager">
      <div className="shortcut-manager__head">
        <span>{shortcuts.length} of 16 shortcuts</span>
        <div className="shortcut-manager__head-actions">
          <ConfirmButton
            className="button button--small"
            confirmLabel="Restore defaults?"
            onConfirm={() => {
              setShortcuts(cloneDefaultShortcuts());
              toast('Default shortcuts restored.', 'success');
            }}
          >
            <RotateCcw aria-hidden="true" />
            Defaults
          </ConfirmButton>
          <button
            type="button"
            className="button button--small button--primary"
            disabled={shortcuts.length >= 16}
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus aria-hidden="true" />
            Add
          </button>
        </div>
      </div>

      {shortcuts.length === 0 ? (
        <div className="empty-state">
          <strong>No shortcuts yet.</strong>
          <span>Add a site you open every day.</span>
        </div>
      ) : (
        <div className="shortcut-manager__list">
          {shortcuts.map((shortcut, index) => (
            <div
              key={shortcut.id}
              className={`shortcut-row ${dragId === shortcut.id ? 'shortcut-row--dragging' : ''} ${
                overId === shortcut.id && dragId !== shortcut.id ? 'shortcut-row--drop' : ''
              }`}
              draggable
              onDragStart={(event) => {
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
              }}
            >
              <span className="shortcut-row__grip" aria-hidden="true">
                <GripVertical />
              </span>
              <span className="shortcut-row__icon">
                <ShortcutIcon name={shortcut.name} url={shortcut.url} icon={shortcut.icon} />
              </span>
              <span className="shortcut-row__copy">
                <strong>{shortcut.name}</strong>
                <small>{shortcut.url}</small>
              </span>
              <span className="shortcut-row__actions">
                <button
                  type="button"
                  className="icon-button icon-button--ghost"
                  aria-label={`Move ${shortcut.name} up`}
                  title="Move up"
                  disabled={index === 0}
                  onClick={() => shift(index, -1)}
                >
                  <ArrowUp aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="icon-button icon-button--ghost"
                  aria-label={`Move ${shortcut.name} down`}
                  title="Move down"
                  disabled={index === shortcuts.length - 1}
                  onClick={() => shift(index, 1)}
                >
                  <ArrowDown aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="icon-button icon-button--ghost"
                  aria-label={`Edit ${shortcut.name}`}
                  title="Edit"
                  onClick={() => {
                    setEditing(shortcut);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil aria-hidden="true" />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      <ShortcutDialog
        open={dialogOpen}
        shortcut={editing}
        onClose={() => setDialogOpen(false)}
        onSave={save}
        onDelete={(id) => {
          setShortcuts(shortcuts.filter((shortcut) => shortcut.id !== id));
          toast('Shortcut removed.');
        }}
      />
    </div>
  );
}
