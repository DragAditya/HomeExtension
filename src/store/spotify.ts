import { create } from 'zustand';
import {
  SpotifyError,
  beginSpotifyAuth,
  clearSpotifyTokens,
  controlSpotify,
  getSpotifyPlayer,
  loadSpotifyTokens,
  refreshSpotifyToken,
  saveSpotifyTokens,
  spotifyTokenExpired,
  type SpotifyControlAction,
  type SpotifyPlayer,
  type SpotifyTokens,
} from '../lib/spotify';
import { useSettings } from './settings';
import { useUI } from './ui';

type SpotifyStatus = 'idle' | 'connecting' | 'connected' | 'error';

type SpotifyStore = {
  tokens: SpotifyTokens | null;
  player: SpotifyPlayer | null;
  status: SpotifyStatus;
  connecting: boolean;
  syncing: boolean;
  error: string | null;
  errorKind: string | null;
  lastSynced: number | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  syncPlayer: () => Promise<void>;
  control: (action: SpotifyControlAction, value?: number) => Promise<void>;
  clearError: () => void;
};

let refreshInFlight: Promise<SpotifyTokens> | null = null;

function clientId(): string {
  return useSettings.getState().settings.integrations.spotifyClientId;
}

async function ensureFreshTokens(tokens: SpotifyTokens): Promise<SpotifyTokens> {
  if (!spotifyTokenExpired(tokens)) return tokens;
  if (refreshInFlight) return refreshInFlight;
  const id = clientId();
  refreshInFlight = refreshSpotifyToken(tokens, id)
    .then(async (next) => {
      await saveSpotifyTokens(next);
      useSpotify.setState({ tokens: next, error: null, errorKind: null });
      return next;
    })
    .catch(async (error: unknown) => {
      if (error instanceof SpotifyError && error.kind === 'auth') {
        await clearSpotifyTokens();
        useSpotify.setState({
          tokens: null,
          player: null,
          status: 'error',
          error: 'Spotify needs to be reconnected.',
          errorKind: 'auth',
        });
      }
      throw error;
    })
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

function messageFor(error: unknown): { message: string; kind: string } {
  if (error instanceof SpotifyError) return { message: error.message, kind: error.kind };
  if (error instanceof Error && error.name === 'AbortError') {
    return { message: 'Spotify request was cancelled.', kind: 'aborted' };
  }
  return { message: 'Spotify is unavailable right now.', kind: 'unknown' };
}

export const useSpotify = create<SpotifyStore>((set, get) => ({
  tokens: null,
  player: null,
  status: 'idle',
  connecting: false,
  syncing: false,
  error: null,
  errorKind: null,
  lastSynced: null,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    set({ hydrated: true });
    const saved = await loadSpotifyTokens();
    if (!saved) return;
    let tokens = saved;
    if (spotifyTokenExpired(saved)) {
      if (!saved.refreshToken) {
        await clearSpotifyTokens();
        return;
      }
      try {
        tokens = await ensureFreshTokens(saved);
      } catch (error) {
        const detail = messageFor(error);
        set({ tokens: saved, status: 'error', error: detail.message, errorKind: detail.kind });
        return;
      }
    }
    set({ tokens, status: 'connected', error: null, errorKind: null });
    void get().syncPlayer();
  },

  connect: async () => {
    if (get().connecting) return;
    const id = clientId().trim();
    if (!id) {
      useUI.getState().toast('Add your Spotify client ID first.', 'error');
      set({ error: 'Add your Spotify client ID first.', errorKind: 'config' });
      return;
    }
    set({ connecting: true, status: 'connecting', error: null, errorKind: null });
    try {
      const tokens = await beginSpotifyAuth(id);
      await saveSpotifyTokens(tokens);
      set({ tokens, status: 'connected', connecting: false, error: null, errorKind: null });
      useUI.getState().toast('Spotify connected.', 'success');
      await get().syncPlayer();
    } catch (error) {
      const detail = messageFor(error);
      set({ connecting: false, status: 'error', error: detail.message, errorKind: detail.kind });
      useUI.getState().toast(detail.message, 'error');
    }
  },

  disconnect: async () => {
    await clearSpotifyTokens();
    set({
      tokens: null,
      player: null,
      status: 'idle',
      error: null,
      errorKind: null,
      lastSynced: null,
    });
    useUI.getState().toast('Spotify disconnected.');
  },

  syncPlayer: async () => {
    const state = get();
    if (!state.tokens || state.syncing) return;
    set({ syncing: true });
    try {
      const tokens = await ensureFreshTokens(state.tokens);
      const player = await getSpotifyPlayer(tokens);
      set({
        player,
        status: 'connected',
        error: null,
        errorKind: null,
        lastSynced: Date.now(),
        syncing: false,
      });
    } catch (error) {
      const detail = messageFor(error);
      if (detail.kind === 'aborted') {
        set({ syncing: false });
        return;
      }
      set({
        syncing: false,
        status: detail.kind === 'auth' ? 'error' : get().status,
        error: detail.message,
        errorKind: detail.kind,
      });
    }
  },

  control: async (action, value) => {
    const state = get();
    if (!state.tokens) {
      useUI.getState().toast('Connect Spotify to control playback.', 'error');
      return;
    }
    if (state.player) {
      if (action === 'play' || action === 'pause') {
        set({ player: { ...state.player, isPlaying: action === 'play' } });
      }
      if (action === 'volume' && typeof value === 'number') {
        set({ player: { ...state.player, volume: value } });
      }
    }
    try {
      const tokens = await ensureFreshTokens(state.tokens);
      await controlSpotify(tokens, action, value);
      set({ error: null, errorKind: null });
      window.setTimeout(() => {
        void get().syncPlayer();
      }, 420);
    } catch (error) {
      const detail = messageFor(error);
      set({ error: detail.message, errorKind: detail.kind });
      useUI.getState().toast(detail.message, 'error');
      void get().syncPlayer();
    }
  },

  clearError: () => set({ error: null, errorKind: null }),
}));
