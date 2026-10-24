import { create } from 'zustand';
import { playChime, unlockAudio } from '../lib/audio';
import {
  defaultFocusState,
  nextMode,
  normalizeFocusState,
  phaseMs,
  remainingFrom,
  todayKey,
  type FocusState,
} from '../lib/focus';
import { FOCUS_KEY, storageGet, storageSet } from '../lib/storage';
import { useSettings } from './settings';
import { useUI } from './ui';

type FocusStore = {
  state: FocusState;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  skip: () => void;
  tick: () => void;
  syncDurations: (workMinutes: number, breakMinutes: number) => void;
};

function focusSettings() {
  return useSettings.getState().settings.widgets.focus;
}

function durations() {
  const focus = focusSettings();
  return { work: focus.workMinutes, break: focus.breakMinutes };
}

function persist(state: FocusState): void {
  void storageSet(FOCUS_KEY, state).catch(() => {
    // Focus is still usable for this session if persistence fails.
  });
}

export const useFocus = create<FocusStore>((set, get) => ({
  state: defaultFocusState(25),
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const focus = focusSettings();
    const outcome = await storageGet<unknown>(FOCUS_KEY).catch(() => undefined);
    let restored = normalizeFocusState(
      outcome,
      focus.workMinutes,
      focus.breakMinutes,
      new Date(),
    );
    const now = Date.now();
    if (restored.status === 'running' && restored.endAt !== null && restored.endAt <= now) {
      const completedWork = restored.mode === 'work';
      const upcoming = nextMode(restored.mode);
      restored = {
        mode: upcoming,
        status: 'idle',
        remainingMs: phaseMs(upcoming, focus.workMinutes, focus.breakMinutes),
        endAt: null,
        sessionsToday: completedWork
          ? Math.min(99, restored.sessionsToday + 1)
          : restored.sessionsToday,
        lastSessionDate: todayKey(),
      };
      persist(restored);
    }
    set({ state: restored, hydrated: true });
  },

  start: () => {
    const current = get().state;
    if (current.status === 'running') return;
    unlockAudio();
    const focus = focusSettings();
    const total = phaseMs(current.mode, focus.workMinutes, focus.breakMinutes);
    const remaining =
      current.status === 'paused'
        ? Math.max(1, remainingFrom(current))
        : current.remainingMs > 0
          ? current.remainingMs
          : total;
    const next: FocusState = {
      ...current,
      status: 'running',
      remainingMs: remaining,
      endAt: Date.now() + remaining,
      lastSessionDate: todayKey(),
      sessionsToday:
        current.lastSessionDate === todayKey() ? current.sessionsToday : 0,
    };
    set({ state: next });
    persist(next);
  },

  pause: () => {
    const current = get().state;
    if (current.status !== 'running') return;
    const next: FocusState = {
      ...current,
      status: 'paused',
      remainingMs: Math.max(1, remainingFrom(current)),
      endAt: null,
    };
    set({ state: next });
    persist(next);
  },

  toggle: () => {
    if (get().state.status === 'running') get().pause();
    else get().start();
  },

  reset: () => {
    const current = get().state;
    const focus = focusSettings();
    const next: FocusState = {
      ...current,
      status: 'idle',
      remainingMs: phaseMs(current.mode, focus.workMinutes, focus.breakMinutes),
      endAt: null,
      lastSessionDate: todayKey(),
    };
    set({ state: next });
    persist(next);
  },

  skip: () => {
    const current = get().state;
    const focus = focusSettings();
    const upcoming = nextMode(current.mode);
    const next: FocusState = {
      ...current,
      mode: upcoming,
      status: 'idle',
      remainingMs: phaseMs(upcoming, focus.workMinutes, focus.breakMinutes),
      endAt: null,
    };
    set({ state: next });
    persist(next);
    useUI
      .getState()
      .toast(upcoming === 'break' ? 'Skipped to a break.' : 'Back to focus.');
  },

  tick: () => {
    const current = get().state;
    if (
      current.status !== 'running' ||
      current.endAt === null ||
      current.endAt > Date.now()
    ) {
      return;
    }
    const focus = focusSettings();
    const completed = current.mode;
    const upcoming = nextMode(completed);
    const nextRemaining = phaseMs(upcoming, focus.workMinutes, focus.breakMinutes);
    const sessionsToday =
      completed === 'work' ? Math.min(99, current.sessionsToday + 1) : current.sessionsToday;
    const autoplay = focus.autoCycle;

    if (focus.chime) playChime();
    const next: FocusState = {
      mode: upcoming,
      status: autoplay ? 'running' : 'idle',
      remainingMs: nextRemaining,
      endAt: autoplay ? Date.now() + nextRemaining : null,
      sessionsToday,
      lastSessionDate: todayKey(),
    };
    set({ state: next });
    persist(next);

    if (completed === 'work') {
      useUI
        .getState()
        .toast(
          autoplay ? 'Focus complete. Your break has started.' : 'Focus complete. Take a break.',
          'success',
        );
    } else {
      useUI
        .getState()
        .toast(
          autoplay ? 'Break over. Focus has started.' : 'Break over. Ready to focus?',
          'success',
        );
    }
  },

  syncDurations: (workMinutes, breakMinutes) => {
    const current = get().state;
    if (current.status !== 'idle') return;
    const total = phaseMs(current.mode, workMinutes, breakMinutes);
    if (current.remainingMs === total) return;
    set({ state: { ...current, remainingMs: total } });
  },
}));

useFocus.subscribe((state, previous) => {
  if (state.hydrated && state.state !== previous.state) persist(state.state);
});
