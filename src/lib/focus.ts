export type FocusMode = 'work' | 'break';
export type FocusStatus = 'idle' | 'running' | 'paused';

export type FocusState = {
  mode: FocusMode;
  status: FocusStatus;
  remainingMs: number;
  endAt: number | null;
  sessionsToday: number;
  lastSessionDate: string;
};

export function todayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

export function clampFocusDurations(
  workMinutes: number,
  breakMinutes: number,
): { work: number; break: number } {
  return {
    work: Math.round(Math.min(90, Math.max(5, workMinutes))),
    break: Math.round(Math.min(30, Math.max(1, breakMinutes))),
  };
}

export function phaseMs(
  mode: FocusMode,
  workMinutes: number,
  breakMinutes: number,
): number {
  const durations = clampFocusDurations(workMinutes, breakMinutes);
  return (mode === 'work' ? durations.work : durations.break) * 60 * 1000;
}

export function nextMode(mode: FocusMode): FocusMode {
  return mode === 'work' ? 'break' : 'work';
}

export function remainingFrom(state: FocusState, now = Date.now()): number {
  if (state.status === 'running' && state.endAt !== null) {
    return Math.max(0, state.endAt - now);
  }
  return Math.max(0, state.remainingMs);
}

export function defaultFocusState(workMinutes: number): FocusState {
  return {
    mode: 'work',
    status: 'idle',
    remainingMs: workMinutes * 60 * 1000,
    endAt: null,
    sessionsToday: 0,
    lastSessionDate: todayKey(),
  };
}

export function normalizeFocusState(
  value: unknown,
  workMinutes: number,
  breakMinutes: number,
  now = new Date(),
): FocusState {
  const today = todayKey(now);
  const fallback: FocusState = {
    mode: 'work',
    status: 'idle',
    remainingMs: phaseMs('work', workMinutes, breakMinutes),
    endAt: null,
    sessionsToday: 0,
    lastSessionDate: today,
  };
  if (!value || typeof value !== 'object') return fallback;
  const raw = value as Record<string, unknown>;
  const mode: FocusMode = raw.mode === 'break' ? 'break' : 'work';
  const status: FocusStatus =
    raw.status === 'running' || raw.status === 'paused' ? raw.status : 'idle';
  const sessionsToday =
    typeof raw.sessionsToday === 'number' && Number.isFinite(raw.sessionsToday)
      ? Math.max(0, Math.min(99, Math.round(raw.sessionsToday)))
      : 0;
  const lastSessionDate =
    typeof raw.lastSessionDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.lastSessionDate)
      ? raw.lastSessionDate
      : today;
  const total = phaseMs(mode, workMinutes, breakMinutes);
  const remainingMs =
    typeof raw.remainingMs === 'number' && Number.isFinite(raw.remainingMs)
      ? Math.max(0, Math.min(total, raw.remainingMs))
      : total;
  const endAt =
    typeof raw.endAt === 'number' && Number.isFinite(raw.endAt) ? raw.endAt : null;

  return {
    mode,
    status: status === 'running' && endAt === null ? 'paused' : status,
    remainingMs: remainingMs === 0 && status === 'idle' ? total : remainingMs,
    endAt,
    sessionsToday: lastSessionDate === today ? sessionsToday : 0,
    lastSessionDate: today,
  };
}

export function focusProgress(remaining: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, 1 - remaining / total));
}
