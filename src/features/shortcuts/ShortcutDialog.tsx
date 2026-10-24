import { useEffect, useId, useState } from 'react';
import { ConfirmButton } from '../../components/ui/ConfirmButton';
import { Dialog } from '../../components/ui/Dialog';
import { validateShortcutInput, type ShortcutInput } from '../../lib/favicon';
import type { Shortcut } from '../../lib/settings/types';
import { ShortcutIcon } from './ShortcutIcon';

type ShortcutDialogProps = {
  open: boolean;
  shortcut: Shortcut | null;
  onClose: () => void;
  onSave: (value: ShortcutInput, id?: string) => void;
  onDelete: (id: string) => void;
};

type Errors = { name?: string; url?: string; icon?: string };

export function ShortcutDialog({
  open,
  shortcut,
  onClose,
  onSave,
  onDelete,
}: ShortcutDialogProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const ids = useId();

  useEffect(() => {
    if (!open) return;
    setName(shortcut?.name ?? '');
    setUrl(shortcut?.url ?? '');
    setIcon(shortcut?.icon ?? '');
    setErrors({});
  }, [open, shortcut]);

  const submit = () => {
    const result = validateShortcutInput({ name, url, icon });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onSave(result.value, shortcut?.id);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} label={shortcut ? 'Edit shortcut' : 'Add shortcut'}>
      <form
        className="shortcut-dialog"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="shortcut-dialog__head">
          <div className="shortcut-dialog__preview" aria-hidden="true">
            <ShortcutIcon name={name || 'New'} url={url || 'https://example.com'} icon={icon || undefined} />
          </div>
          <div>
            <h2 className="dialog__title">{shortcut ? 'Edit shortcut' : 'Add a shortcut'}</h2>
            <p className="dialog__description">
              {shortcut ? 'Update this tile or remove it from the grid.' : 'A site you open often.'}
            </p>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor={`${ids}-name`}>Name</label>
          <input
            id={`${ids}-name`}
            value={name}
            maxLength={40}
            placeholder="Figma"
            autoFocus
            aria-invalid={Boolean(errors.name)}
            onChange={(event) => {
              setName(event.target.value);
              if (errors.name) setErrors((current) => ({ ...current, name: undefined }));
            }}
          />
          {errors.name && <span className="form-field__error">{errors.name}</span>}
        </div>

        <div className="form-field">
          <label htmlFor={`${ids}-url`}>URL</label>
          <input
            id={`${ids}-url`}
            value={url}
            placeholder="figma.com"
            inputMode="url"
            spellCheck={false}
            aria-invalid={Boolean(errors.url)}
            onChange={(event) => {
              setUrl(event.target.value);
              if (errors.url) setErrors((current) => ({ ...current, url: undefined }));
            }}
          />
          {errors.url && <span className="form-field__error">{errors.url}</span>}
        </div>

        <div className="form-field">
          <label htmlFor={`${ids}-icon`}>Custom icon URL <span>optional</span></label>
          <input
            id={`${ids}-icon`}
            value={icon}
            placeholder="https://…/icon.png"
            inputMode="url"
            spellCheck={false}
            aria-invalid={Boolean(errors.icon)}
            onChange={(event) => {
              setIcon(event.target.value);
              if (errors.icon) setErrors((current) => ({ ...current, icon: undefined }));
            }}
          />
          {errors.icon && <span className="form-field__error">{errors.icon}</span>}
        </div>

        <div className="shortcut-dialog__footer">
          {shortcut ? (
            <ConfirmButton
              className="button button--danger"
              confirmLabel="Delete shortcut?"
              onConfirm={() => {
                onDelete(shortcut.id);
                onClose();
              }}
            >
              Delete
            </ConfirmButton>
          ) : (
            <span />
          )}
          <div className="shortcut-dialog__actions">
            <button type="button" className="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button button--primary">
              {shortcut ? 'Save changes' : 'Add shortcut'}
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
