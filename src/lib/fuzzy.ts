export function fuzzyScore(text: string, query: string): number | null {
  const needle = query.trim().toLowerCase();
  if (!needle) return 0;
  const haystack = text.toLowerCase();
  if (!haystack) return null;
  if (haystack === needle) return 140;
  if (haystack.startsWith(needle)) return 120 - Math.min(24, haystack.length - needle.length);
  const direct = haystack.indexOf(needle);
  if (direct >= 0) return 92 - Math.min(30, direct);
  const boundary = new RegExp(`(^|[\\s·—/(.,-])${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(
    haystack,
  );
  if (boundary) return 80;
  let cursor = 0;
  let gaps = 0;
  for (const character of needle) {
    const found = haystack.indexOf(character, cursor);
    if (found < 0) return null;
    gaps += Math.max(0, found - cursor);
    cursor = found + 1;
  }
  return 48 - Math.min(30, gaps);
}
