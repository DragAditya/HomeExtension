import { formatDate } from '../../lib/time';
import { useNow } from '../../lib/useNow';
import { useSettings } from '../../store/settings';

export function DateLine() {
  const style = useSettings((state) => state.settings.layout.dateStyle);
  const now = useNow(30000);
  const value = formatDate(now, style);
  const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;

  return (
    <time className="date-line" dateTime={iso}>
      {value}
    </time>
  );
}
