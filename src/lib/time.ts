export type ClockOptions = {
  hour12: boolean;
  seconds: boolean;
};

export function formatClock(
  date: Date,
  options: ClockOptions,
  locale?: string,
): { time: string; suffix: string } {
  const formatter = new Intl.DateTimeFormat(locale, {
    hour: options.hour12 ? 'numeric' : '2-digit',
    minute: '2-digit',
    ...(options.seconds ? { second: '2-digit' as const } : {}),
    hour12: options.hour12,
  });
  const parts = formatter.formatToParts(date);
  const suffix = parts.find((part) => part.type === 'dayPeriod')?.value ?? '';
  const time = parts
    .filter((part) => part.type !== 'dayPeriod')
    .map((part) => part.value)
    .join('')
    .trim();
  return { time, suffix };
}

export function formatDate(date: Date, style: 'short' | 'long', locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: style === 'long' ? 'long' : 'short',
    month: style === 'long' ? 'long' : 'short',
    day: 'numeric',
  }).format(date);
}

export function greetingWord(date: Date): string {
  const hour = date.getHours();
  if (hour < 5) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return `${hours}:${String(remainder).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
