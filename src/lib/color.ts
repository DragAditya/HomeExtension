export type Rgb = { r: number; g: number; b: number };

export function hexToRgb(hex: string): Rgb | null {
  const value = hex.trim().replace('#', '');
  if (value.length === 3) {
    const [r, g, b] = value.split('');
    return {
      r: Number.parseInt(r + r, 16),
      g: Number.parseInt(g + g, 16),
      b: Number.parseInt(b + b, 16),
    };
  }
  if (!/^[0-9a-f]{6}$/i.test(value)) return null;
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const channel = (value: number) =>
    Math.round(Math.min(255, Math.max(0, value)))
      .toString(16)
      .padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

export function rgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(124, 155, 255, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function rgbChannels(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '124, 155, 255';
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
}

export function mixHex(a: string, b: string, amount: number): string {
  const first = hexToRgb(a);
  const second = hexToRgb(b);
  if (!first || !second) return a;
  const ratio = Math.min(1, Math.max(0, amount));
  return rgbToHex({
    r: first.r + (second.r - first.r) * ratio,
    g: first.g + (second.g - first.g) * ratio,
    b: first.b + (second.b - first.b) * ratio,
  });
}

export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b)
  );
}

export function contrastRatio(a: string, b: string): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

export function contrastText(hex: string): string {
  return contrastRatio(hex, '#ffffff') >= contrastRatio(hex, '#05070d')
    ? '#ffffff'
    : '#05070d';
}
