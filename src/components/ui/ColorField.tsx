const SWATCHES = [
  '#7c9bff',
  '#5fe3d3',
  '#ffb07a',
  '#f4a7c3',
  '#d7def0',
  '#a34f24',
  '#8bd17c',
  '#ff7a8a',
];

type ColorFieldProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
};

export function ColorField({ value, onChange, label }: ColorFieldProps) {
  return (
    <div className="color-field">
      {SWATCHES.map((swatch) => (
        <button
          key={swatch}
          type="button"
          className="swatch"
          style={{ background: swatch }}
          aria-label={`Use ${swatch}`}
          aria-pressed={value.toLowerCase() === swatch}
          onClick={() => onChange(swatch)}
        />
      ))}
      <input
        className="color-input"
        type="color"
        aria-label={label ?? 'Custom accent color'}
        value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#7c9bff'}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
