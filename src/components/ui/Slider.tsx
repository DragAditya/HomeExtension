import type { CSSProperties } from 'react';

type SliderProps = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  label?: string;
};

export function Slider({ value, onChange, min, max, step = 1, unit = '', label }: SliderProps) {
  const progress = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return (
    <div className="slider">
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--progress': `${progress}%` } as CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="slider__value">
        {value}
        {unit}
      </span>
    </div>
  );
}
