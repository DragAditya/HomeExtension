import { SPOTIFY_TOKENS_KEY, storageGet, storageRemove, storageSet } from './storage';

const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const API_ENDPOINT = 'https://api.spotify.com/v1';
const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
];

export type SpotifyTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope?: string;
  tokenType?: string;
};

export type SpotifyTrack = {
  id: string;
  name: string;
  artists: string;
  album: string;
  image: string | null;
  durationMs: number;
  url: string;
};

export type SpotifyPlayer = {
  isPlaying: boolean;
  progressMs: number;
  track: SpotifyTrack | null;
  deviceName: string | null;
  volume: number | null;
  shuffle: boolean;
  repeat: 'off' | 'context' | 'track';
};

export type SpotifyControlAction =
  | 'play'
  | 'pause'
  | 'next'
  | 'previous'
  | 'volume';

export type SpotifyErrorKind = 'auth' | 'premium' | 'no-device' | 'rate-limit' | 'network' | 'unknown';

export class SpotifyError extends Error {
  kind: SpotifyErrorKind;

  constructor(kind: SpotifyErrorKind, message: string) {
    super(message);
    this.name = 'SpotifyError';
    this.kind = kind;
  }
}

type TokenResponse = {
  access_token: string;
  token_type?: string;
  scope?: string;
  expires_in: number;
  refresh_token?: string;
};

type SpotifyImage = { url: string; width?: number; height?: number };

type SpotifyApiPlayer = {
  is_playing: boolean;
  progress_ms: number | null;
  shuffle_state?: boolean;
  repeat_state?: 'off' | 'context' | 'track';
  device?: { name?: string; volume_percent?: number | null };
  item?: {
    id?: string;
    name?: string;
    duration_ms?: number;
    external_urls?: { spotify?: string };
    artists?: Array<{ name?: string }>;
    album?: { name?: string; images?: SpotifyImage[] };
  } | null;
};

export function hasIdentityApi(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    Boolean(chrome.identity) &&
    typeof chrome.identity.launchWebAuthFlow === 'function'
  );
}

export function spotifyRedirectUri(): string {
  if (hasIdentityApi() && typeof chrome.identity.getRedirectURL === 'function') {
    return chrome.identity.getRedirectURL();
  }
  if (typeof window !== 'undefined') return `${window.location.origin}/`;
  return '';
}

export function createRandomString(length = 64): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let output = '';
  for (const byte of bytes) output += alphabet[byte % alphabet.length];
  return output;
}

function base64Url(bytes: ArrayBuffer | Uint8Array): string {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (const byte of array) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function createPkcePair(): Promise<{ verifier: string; challenge: string }> {
  const verifier = createRandomString(64);
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return { verifier, challenge: base64Url(hash) };
}

export async function createAuthUrl(
  clientId: string,
  challenge: string,
  state: string,
  redirectUri = spotifyRedirectUri(),
): Promise<string> {
  const params = new URLSearchParams({
    client_id: clientId.trim(),
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
    scope: SCOPES.join(' '),
    show_dialog: 'false',
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

export function parseAuthCallback(
  callbackUrl: string,
  expectedState: string,
): { code: string } | { error: string } {
  let parsed: URL;
  try {
    parsed = new URL(callbackUrl);
  } catch {
    return { error: 'Spotify returned an unreadable response.' };
  }
  const params = new URLSearchParams(parsed.search);
  if (parsed.hash) {
    const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ''));
    for (const [key, value] of fragment) {
      if (!params.has(key)) params.set(key, value);
    }
  }
  const error = params.get('error');
  if (error) {
    if (error === 'access_denied') return { error: 'Spotify access was declined.' };
    return { error: params.get('error_description') ?? 'Spotify authorization failed.' };
  }
  if (params.get('state') !== expectedState) {
    return { error: 'Spotify authorization could not be verified. Try again.' };
  }
  const code = params.get('code');
  if (!code) return { error: 'Spotify did not return an authorization code.' };
  return { code };
}

function tokenFromResponse(data: TokenResponse, previousRefresh?: string): SpotifyTokens {
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? previousRefresh ?? '',
    expiresAt: Date.now() + Math.max(0, data.expires_in) * 1000,
    scope: data.scope,
    tokenType: data.token_type,
  };
}

async function requestToken(body: URLSearchParams): Promise<TokenResponse> {
  let response: Response;
  try {
    response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      cache: 'no-store',
    });
  } catch {
    throw new SpotifyError('network', 'Could not reach Spotify. Check your connection.');
  }
  if (!response.ok) {
    const message =
      response.status === 400
        ? 'Spotify rejected the authorization. Check the client ID and redirect URI.'
        : 'Spotify could not complete the connection.';
    throw new SpotifyError('auth', message);
  }
  return (await response.json()) as TokenResponse;
}

export async function exchangeSpotifyCode(
  clientId: string,
  code: string,
  verifier: string,
  redirectUri = spotifyRedirectUri(),
): Promise<SpotifyTokens> {
  const body = new URLSearchParams({
    client_id: clientId.trim(),
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });
  const data = await requestToken(body);
  return tokenFromResponse(data);
}

export async function beginSpotifyAuth(clientId: string): Promise<SpotifyTokens> {
  const trimmed = clientId.trim();
  if (!trimmed) throw new SpotifyError('auth', 'Add your Spotify client ID first.');
  if (!hasIdentityApi()) {
    throw new SpotifyError(
      'auth',
      'Spotify connection needs the installed Chrome extension. Load the unpacked build to connect.',
    );
  }
  if (!crypto?.subtle) {
    throw new SpotifyError('auth', 'This browser cannot create a secure Spotify connection.');
  }
  const { verifier, challenge } = await createPkcePair();
  const state = createRandomString(32);
  const redirectUri = spotifyRedirectUri();
  const url = await createAuthUrl(trimmed, challenge, state, redirectUri);

  const callbackUrl = await new Promise<string>((resolve, reject) => {
    chrome.identity.launchWebAuthFlow({ url, interactive: true }, (responseUrl) => {
      const error = chrome.runtime?.lastError;
      if (error) {
        reject(new SpotifyError('auth', error.message || 'Spotify authorization failed.'));
        return;
      }
      if (!responseUrl) {
        reject(new SpotifyError('auth', 'Spotify authorization was cancelled.'));
        return;
      }
      resolve(responseUrl);
    });
  });

  const parsed = parseAuthCallback(callbackUrl, state);
  if ('error' in parsed) throw new SpotifyError('auth', parsed.error);
  return exchangeSpotifyCode(trimmed, parsed.code, verifier, redirectUri);
}

export async function refreshSpotifyToken(
  tokens: SpotifyTokens,
  clientId: string,
): Promise<SpotifyTokens> {
  if (!tokens.refreshToken) {
    throw new SpotifyError('auth', 'Spotify needs to be connected again.');
  }
  const body = new URLSearchParams({
    client_id: clientId.trim(),
    grant_type: 'refresh_token',
    refresh_token: tokens.refreshToken,
  });
  const data = await requestToken(body);
  return tokenFromResponse(data, tokens.refreshToken);
}

export function spotifyTokenExpired(tokens: SpotifyTokens, skewMs = 60000): boolean {
  return !tokens.accessToken || tokens.expiresAt <= Date.now() + skewMs;
}

export async function saveSpotifyTokens(tokens: SpotifyTokens): Promise<void> {
  await storageSet(SPOTIFY_TOKENS_KEY, tokens);
}

const LEGACY_TOKEN_KEY = 'lumen-spotify-token';
const LEGACY_REFRESH_KEY = 'lumen-spotify-refresh';
const LEGACY_EXPIRES_KEY = 'lumen-spotify-expires';

function readLegacySpotifyTokens(): SpotifyTokens | null {
  if (typeof window === 'undefined') return null;
  try {
    const accessToken = window.localStorage.getItem(LEGACY_TOKEN_KEY);
    if (!accessToken) return null;
    const refreshToken = window.localStorage.getItem(LEGACY_REFRESH_KEY) ?? '';
    const expiresAt = Number(window.localStorage.getItem(LEGACY_EXPIRES_KEY) ?? 0);
    return {
      accessToken,
      refreshToken,
      expiresAt: Number.isFinite(expiresAt) ? expiresAt : 0,
      tokenType: 'Bearer',
    };
  } catch {
    return null;
  }
}

function clearLegacySpotifyTokens(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(LEGACY_TOKEN_KEY);
    window.localStorage.removeItem(LEGACY_REFRESH_KEY);
    window.localStorage.removeItem(LEGACY_EXPIRES_KEY);
  } catch {
    // The migrated token is already saved under the new key.
  }
}

export async function loadSpotifyTokens(): Promise<SpotifyTokens | null> {
  let stored: unknown;
  try {
    stored = await storageGet<unknown>(SPOTIFY_TOKENS_KEY);
  } catch {
    stored = undefined;
  }

  if (stored && typeof stored === 'object') {
    const raw = stored as Partial<SpotifyTokens>;
    if (
      typeof raw.accessToken !== 'string' ||
      typeof raw.refreshToken !== 'string' ||
      typeof raw.expiresAt !== 'number'
    ) {
      return null;
    }
    return {
      accessToken: raw.accessToken,
      refreshToken: raw.refreshToken,
      expiresAt: raw.expiresAt,
      scope: typeof raw.scope === 'string' ? raw.scope : undefined,
      tokenType: typeof raw.tokenType === 'string' ? raw.tokenType : undefined,
    };
  }

  const legacy = readLegacySpotifyTokens();
  if (!legacy) return null;
  try {
    await saveSpotifyTokens(legacy);
    clearLegacySpotifyTokens();
  } catch {
    // Keep the legacy token available for the next attempt.
  }
  return legacy;
}

export async function clearSpotifyTokens(): Promise<void> {
  try {
    await storageRemove(SPOTIFY_TOKENS_KEY);
  } catch {
    // Ignore.
  }
}

function errorForStatus(status: number, retryAfter?: number): SpotifyError {
  if (status === 401) return new SpotifyError('auth', 'Spotify session expired. Reconnect Spotify.');
  if (status === 403) {
    return new SpotifyError('premium', 'Spotify playback controls require a Premium account.');
  }
  if (status === 404) {
    return new SpotifyError('no-device', 'Open Spotify on a device and start something first.');
  }
  if (status === 429) {
    return new SpotifyError(
      'rate-limit',
      retryAfter
        ? `Spotify is rate-limiting requests. Try again in ${retryAfter}s.`
        : 'Spotify is rate-limiting requests. Try again in a moment.',
    );
  }
  return new SpotifyError('unknown', 'Spotify did not answer as expected.');
}

async function spotifyFetch(
  path: string,
  tokens: SpotifyTokens,
  init: RequestInit = {},
): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${API_ENDPOINT}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init.headers ?? {}),
      },
      cache: 'no-store',
    });
  } catch {
    throw new SpotifyError('network', 'Could not reach Spotify. Check your connection.');
  }
  if (!response.ok && response.status !== 204) {
    const retryAfter = Number(response.headers.get('Retry-After') ?? '') || undefined;
    throw errorForStatus(response.status, retryAfter);
  }
  return response;
}

export async function getSpotifyPlayer(
  tokens: SpotifyTokens,
  signal?: AbortSignal,
): Promise<SpotifyPlayer | null> {
  const response = await spotifyFetch('/me/player', tokens, { signal });
  if (response.status === 204) return null;
  const data = (await response.json()) as SpotifyApiPlayer;
  const item = data.item;
  const images = item?.album?.images ?? [];
  const track = item
    ? {
        id: item.id ?? '',
        name: item.name ?? 'Unknown track',
        artists: (item.artists ?? [])
          .map((artist) => artist.name)
          .filter(Boolean)
          .join(', ') || 'Unknown artist',
        album: item.album?.name ?? '',
        image: images[0]?.url ?? null,
        durationMs: item.duration_ms ?? 0,
        url: item.external_urls?.spotify ?? '',
      }
    : null;
  return {
    isPlaying: Boolean(data.is_playing),
    progressMs: data.progress_ms ?? 0,
    track,
    deviceName: data.device?.name ?? null,
    volume: data.device?.volume_percent ?? null,
    shuffle: Boolean(data.shuffle_state),
    repeat: data.repeat_state ?? 'off',
  };
}

export async function controlSpotify(
  tokens: SpotifyTokens,
  action: SpotifyControlAction,
  value?: number,
): Promise<void> {
  if (action === 'volume') {
    const volume = Math.min(100, Math.max(0, Math.round(value ?? 50)));
    await spotifyFetch(`/me/player/volume?volume_percent=${volume}`, tokens, { method: 'PUT' });
    return;
  }
  const paths: Record<Exclude<SpotifyControlAction, 'volume'>, [string, string]> = {
    play: ['/me/player/play', 'PUT'],
    pause: ['/me/player/pause', 'PUT'],
    next: ['/me/player/next', 'POST'],
    previous: ['/me/player/previous', 'POST'],
  };
  const [path, method] = paths[action];
  await spotifyFetch(path, tokens, { method });
}
