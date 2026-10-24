import { Pause, Play, Timer } from 'lucide-react';
import type { CSSProperties } from 'react';
import { phaseMs, remainingFrom } from '../../lib/focus';
import { formatDuration } from '../../lib/time';
import { useNow } from '../../lib/useNow';
import { useFocus } from '../../store/focus';
import { useSettings } from '../../store/settings';

export function FocusChip() {
  const state = useFocus((store) => store.state);
  const toggle = useFocus((store) => store.toggle);
  const workMinutes = useSettings((store) => store.settings.widgets.focus.workMinutes);
  const breakMinutes = useSettings((store) => store.settings.widgets.focus.breakMinutes);
  const now = useNow(1000);

  if (state.status === 'idle') return null;

  const total = phaseMs(state.mode, workMinutes, breakMinutes);
  const remaining = remainingFrom(state, now.getTime());
  const progress = total > 0 ? Math.min(1, Math.max(0, 1 - remaining / total)) : 0;
  const running = state.status === 'running';

  return (
    <button
      type="button"
      className={`status-chip status-chip--focus ${running ? 'status-chip--active' : ''}`}
      style={{ '--focus-progress': `${(progress * 100).toFixed(1)}%` } as CSSProperties}
      aria-label={running ? 'Pause focus timer' : 'Resume focus timer'}
      title={`${state.mode === 'work' ? 'Focus' : 'Break'} — ${formatDuration(remaining)} left`}
      onClick={toggle}
    >
      <Timer aria-hidden="true" style={{ width: 14, height: 14 }} />
      <span className="status-chip__label">
        {formatDuration(remaining)} {state.mode === 'work' ? 'Focus' : 'Break'}
      </span>
      {running ? (
        <Pause aria-hidden="true" className="status-chip__state" />
      ) : (
        <Play aria-hidden="true" className="status-chip__state" />
      )}
    </button>
  );
}
