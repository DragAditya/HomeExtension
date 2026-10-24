import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';

type DialogProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  label?: string;
};

export function Dialog({ open, onClose, children, className = '', label }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };
    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`}
      aria-label={label}
      aria-labelledby={label ? undefined : titleId}
      onClose={() => {
        if (open) onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div id={titleId} className="sr-only">
        {label ?? 'Dialog'}
      </div>
      {children}
    </dialog>
  );
}
