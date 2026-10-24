import { FocusChip } from '../../features/focus/FocusChip';
import { SpotifyChip } from '../../features/spotify/SpotifyChip';
import { WeatherChip } from '../../features/weather/WeatherChip';
import { useSettings } from '../../store/settings';

export function TopRail() {
  const weather = useSettings((state) => state.settings.layout.widgets.weather);
  const spotify = useSettings((state) => state.settings.layout.widgets.spotify);
  const focus = useSettings((state) => state.settings.layout.widgets.focus);

  if (!weather && !spotify && !focus) return null;

  return (
    <header className="top-rail">
      <div className="top-rail__chips">{weather && <WeatherChip />}</div>
      <div className="top-rail__chips">
        {spotify && <SpotifyChip />}
        {focus && <FocusChip />}
      </div>
    </header>
  );
}
