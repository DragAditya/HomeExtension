export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  const platform = navigator.platform || '';
  const agent = navigator.userAgent || '';
  return /Mac|iPhone|iPad|iPod/.test(platform) || /Mac OS X/.test(agent);
}

export function modKey(): string {
  return isMac() ? '⌘' : 'Ctrl';
}

export function modCombo(key: string): string {
  return `${modKey()} ${key}`;
}
