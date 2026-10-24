import type { ButtonHTMLAttributes, ReactNode } from 'react';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tone?: 'default' | 'ghost' | 'accent';
  children: ReactNode;
};

export function IconButton({
  label,
  tone = 'default',
  className = '',
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={`icon-button ${tone === 'ghost' ? 'icon-button--ghost' : ''} ${
        tone === 'accent' ? 'icon-button--accent' : ''
      } ${className}`}
      aria-label={label}
      title={label}
      {...rest}
    >
      {children}
    </button>
  );
}
