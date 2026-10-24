import { useEffect, useRef, useState } from 'react';

type TextFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  label?: string;
  validate?: (value: string) => string | null;
  type?: 'text' | 'url';
};

export function TextField({
  value,
  onChange,
  placeholder,
  maxLength,
  label,
  validate,
  type = 'text',
}: TextFieldProps) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) {
      setDraft(value);
      setError(null);
    }
  }, [value]);

  const commit = (next: string) => {
    const trimmed = next.trim();
    const validation = validate?.(trimmed) ?? null;
    setError(validation);
    if (!validation) onChange(trimmed);
    return !validation;
  };

  return (
    <div className={`text-field ${error ? 'text-field--invalid' : ''}`}>
      <input
        type={type}
        value={draft}
        aria-label={label}
        aria-invalid={Boolean(error)}
        placeholder={placeholder}
        maxLength={maxLength}
        spellCheck={false}
        autoComplete="off"
        onFocus={() => {
          focused.current = true;
        }}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          const validation = validate?.(next) ?? null;
          setError(validation);
          if (!validation) onChange(next);
        }}
        onBlur={() => {
          focused.current = false;
          if (!commit(draft)) setDraft(value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
          if (event.key === 'Escape') {
            setDraft(value);
            setError(null);
            event.currentTarget.blur();
          }
        }}
      />
      {error && <div className="text-field__error">{error}</div>}
    </div>
  );
}
