import { ChevronDown } from 'lucide-react';

type Option = { value: string | number; label: string };

type SelectFieldProps = {
  value: string | number;
  options: Option[];
  onChange: (value: string | number) => void;
  label?: string;
};

export function SelectField({ value, options, onChange, label }: SelectFieldProps) {
  return (
    <div className="select">
      <select
        aria-label={label}
        value={String(value)}
        onChange={(event) => {
          const next = options.find((option) => String(option.value) === event.target.value);
          if (next) onChange(next.value);
        }}
      >
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" />
    </div>
  );
}
