import { useNow } from '../../lib/useNow';
import { formatClock } from '../../lib/time';
import { useSettings } from '../../store/settings';

export function Clock() {
  const hour12 = useSettings((state) => state.settings.layout.hour12);
  const showSeconds = useSettings((state) => state.settings.layout.showSeconds);
  const now = useNow(showSeconds ? 1000 : 20000);
  const { time, suffix } = formatClock(now, { hour12, seconds: showSeconds });

  return (
    <time className="clock" dateTime={now.toISOString()}>
      {time}
      {suffix && <span className="clock__suffix">{suffix}</span>}
    </time>
  );
}
