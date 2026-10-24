import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type ConfirmButtonProps = {
  onConfirm: () => void;
  children: ReactNode;
  confirmLabel?: string;
  className?: string;
  title?: string;
  disabled?: boolean;
};

export function ConfirmButton({
  onConfirm,
  children,
  confirmLabel = 'Sure?',
  className = 'button',
  title,
  disabled,
}: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <button
      type="button"
      className={`${className} ${armed ? 'button--danger' : ''}`}
      title={title}
      disabled={disabled}
      onClick={() => {
        if (timer.current) clearTimeout(timer.current);
        if (!armed) {
          setArmed(true);
          timer.current = setTimeout(() => setArmed(false), 3000);
          return;
        }
        setArmed(false);
        onConfirm();
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  );
}
