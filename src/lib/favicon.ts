import { normalizeShortcut, normalizeUrl } from './settings/normalize';

export type ShortcutInput = {
  name: string;
  url: string;
  icon?: string;
};

export type ShortcutValidation =
  | { ok: true; value: ShortcutInput }
  | { ok: false; errors: { name?: string; url?: string; icon?: string } };

export function monogram(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
  }
  const clean = name.replace(/[^a-z0-9]/gi, '');
  return (clean[0] ?? '?').toUpperCase();
}

const BUNDLED_ICONS: Record<string, string> = {
  'chatgpt.com': './icons/shortcuts/chatgpt.png',
  'chat.openai.com': './icons/shortcuts/chatgpt.png',
  'claude.ai': './icons/shortcuts/claude.png',
  'github.com': './icons/shortcuts/github.png',
  'gist.github.com': './icons/shortcuts/github.png',
  'mail.google.com': './icons/shortcuts/gmail.png',
  'gmail.com': './icons/shortcuts/gmail.png',
  'youtube.com': './icons/shortcuts/youtube.png',
};

function bundledIcon(url: string): string | undefined {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    const direct = BUNDLED_ICONS[host];
    if (direct) return direct;
    if (host.endsWith('.youtube.com')) return BUNDLED_ICONS['youtube.com'];
    return undefined;
  } catch {
    return undefined;
  }
}

export function iconCacheKey(url: string, customIcon?: string): string {
  if (customIcon && /^https?:\/\//i.test(customIcon)) return `custom:${customIcon}`;
  try {
    return `host:${new URL(url).hostname.toLowerCase()}`;
  } catch {
    return '';
  }
}

export function faviconCandidates(url: string, customIcon?: string): string[] {
  const candidates: string[] = [];
  if (customIcon && /^https?:\/\//i.test(customIcon)) candidates.push(customIcon);
  const shipped = bundledIcon(url);
  if (shipped) candidates.push(shipped);
  try {
    const parsed = new URL(url);
    candidates.push(
      `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(
        parsed.toString(),
      )}&sz=64`,
    );
    candidates.push(`https://icons.duckduckgo.com/ip3/${parsed.hostname}.ico`);
  } catch {
    // A malformed URL simply falls back to the monogram.
  }
  return candidates;
}

export function validateShortcutInput(input: ShortcutInput): ShortcutValidation {
  const errors: { name?: string; url?: string; icon?: string } = {};
  const name = input.name.trim();
  const url = normalizeUrl(input.url);
  const iconRaw = input.icon?.trim() ?? '';

  if (!name) errors.name = 'Give the shortcut a name.';
  else if (name.length > 40) errors.name = 'Keep the name under 40 characters.';
  if (!url) errors.url = 'Enter a valid http or https address.';
  if (iconRaw && !/^https?:\/\//i.test(iconRaw)) {
    errors.icon = 'Icon URL must start with http:// or https://.';
  }

  if (Object.keys(errors).length > 0 || !url) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name,
      url,
      ...(iconRaw ? { icon: iconRaw } : {}),
    },
  };
}

export function makeShortcut(input: ShortcutInput, id?: string): ShortcutInput & { id: string } {
  const normalized = normalizeShortcut({
    id: id ?? `shortcut-${Date.now().toString(36)}`,
    ...input,
  });
  if (!normalized) throw new Error('Invalid shortcut');
  return normalized;
}
