import { describe, expect, it } from 'vitest';
import { faviconCandidates, iconCacheKey } from '../src/lib/favicon';

describe('shortcut icons', () => {
  it('serves the shipped shortcuts from bundled assets first', () => {
    const candidates = faviconCandidates('https://github.com/');
    expect(candidates[0]).toBe('./icons/shortcuts/github.png');
    expect(candidates[1]).toContain('google.com/s2/favicons');
    expect(candidates[2]).toContain('icons.duckduckgo.com/ip3/github.com.ico');
  });

  it('maps common hosts and subdomains to the bundled set', () => {
    expect(faviconCandidates('https://www.youtube.com/watch?v=1')[0]).toBe(
      './icons/shortcuts/youtube.png',
    );
    expect(faviconCandidates('https://music.youtube.com/')[0]).toBe(
      './icons/shortcuts/youtube.png',
    );
    expect(faviconCandidates('https://mail.google.com/')[0]).toBe(
      './icons/shortcuts/gmail.png',
    );
    expect(faviconCandidates('https://claude.ai/chat')[0]).toBe(
      './icons/shortcuts/claude.png',
    );
  });

  it('lets a custom icon take precedence, then falls back to the bundle', () => {
    const candidates = faviconCandidates('https://chatgpt.com/', 'https://cdn.example.com/icon.png');
    expect(candidates[0]).toBe('https://cdn.example.com/icon.png');
    expect(candidates[1]).toBe('./icons/shortcuts/chatgpt.png');
  });

  it('uses remote services for sites without a bundled asset', () => {
    const candidates = faviconCandidates('https://example.com/page');
    expect(candidates[0]).toContain('google.com/s2/favicons');
    expect(candidates[1]).toContain('icons.duckduckgo.com/ip3/example.com.ico');
  });

  it('keys cached icons by host or custom URL', () => {
    expect(iconCacheKey('https://www.github.com/lumen')).toBe('host:www.github.com');
    expect(iconCacheKey('https://github.com/', 'https://cdn.example.com/icon.png')).toBe(
      'custom:https://cdn.example.com/icon.png',
    );
    expect(iconCacheKey('not a url')).toBe('');
  });
});
