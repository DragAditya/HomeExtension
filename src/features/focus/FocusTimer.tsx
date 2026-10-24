import { Pause, Play, RotateCcw, SkipForward, TimerReset } from 'lucide-react';
import { useEffect } from 'react';
import { focusProgress, phaseMs, remainingFrom } from '../../lib/focus';
import { formatDuration } from '../../lib/time';
import { useNow } from '../../lib/useNow';
import { useFocus } from '../../store/focus';
import { useSettings } from '../../store/settings';

export function FocusTimer() {
  const state = useFocus((store) => store.state);
  const hydrate = useFocus((store) => store.hydrate);
  const start = useFocus((store) => store.start);
  const pause = useFocus((store) => store.pause);
  const reset = useFocus((store) => store.reset);
  const skip = useFocus((store) => store.skip);
  const tick = useFocus((store) => store.tick);
  const syncDurations = useFocus((store) => store.syncDurations);
  const workMinutes = useSettings((store) => store.settings.widgets.focus.workMinutes);
  const breakMinutes = useSettings((store) => store.settings.widgets.focus.breakMinutes);
  const now = useNow(500);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const id = window.setInterval(() => tick(), 800);
    const onVisible = () => tick();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [tick]);

  useEffect(() => {
    syncDurations(workMinutes, breakMinutes);
  }, [breakMinutes, syncDurations, workMinutes]);

  const total = phaseMs(state.mode, workMinutes, breakMinutes);
  const remaining = remainingFrom(state, now.getTime());
  const progress = focusProgress(remaining, total);
  const circumference = 2 * Math.PI * 16;
  const running = state.status === 'running';
  const label =
    state.status === 'paused'
      ? 'Paused'
      : state.mode === 'work'
        ? running
          ? 'Focusing'
          : 'Focus'
        : running
          ? 'On break'
          : 'Break';

  return (
    <div className={`focus-widget ${running ? 'focus-widget--running' : ''}`}>
      <button
        type="button"
        className="focus-widget__ring"
        aria-label={running ? 'Pause focus timer' : 'Start focus timer'}
        title={running ? 'Pause' : 'Start'}
        onClick={() => (running ? pause() : start())}
      >
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <circle className="focus-widget__track" cx="20" cy="20" r="16" />
          <circle
            className="focus-widget__progress"
            cx="20"
            cy="20"
            r="16"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
          />
        </svg>
        {running ? (
          <Pause className="focus-widget__ring-icon" aria-hidden="true" />
        ) : (
          <Play className="focus-widget__ring-icon" aria-hidden="true" />
        )}
      </button>

      <div className="focus-widget__copy">
        <div className="focus-widget__time" aria-label={`${formatDuration(remaining)} remaining`}>
          {formatDuration(remaining)}
        </div>
        <div className="focus-widget__label">
          {label}
          {state.sessionsToday > 0 && (
            <span className="focus-widget__sessions">
              {Array.from({ length: Math.min(4, state.sessionsToday) }).map((_, index) => (
                <i key={index} />
              ))}
              <span>{state.sessionsToday} today</span>
            </span>
          )}
        </div>
      </div>

      <div className="focus-widget__actions">
        <button
          type="button"
          className="focus-action"
          aria-label="Reset focus timer"
          title="Reset"
          onClick={reset}
        >
          <RotateCcw aria-hidden="true" />
        </button>
        <button
          type="button"
          className="focus-action"
          aria-label={state.mode === 'work' ? 'Skip to break' : 'Skip to focus'}
          title={state.mode === 'work' ? 'Skip to break' : 'Skip to focus'}
          onClick={skip}
        >
          <SkipForward aria-hidden="true" />
        </button>
      </div>
      <TimerReset className="focus-widget__watermark" aria-hidden="true" />
    </div>
  );
}
