type Option = { value: string | number; label: string };

type SegmentedProps = {
  value: string | number;
  options: Option[];
  onChange: (value: string | number) => void;
  label?: string;
};

export function Segmented({ value, options, onChange, label }: SegmentedProps) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          className="segmented__option"
          aria-pressed={String(value) === String(option.value)}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
