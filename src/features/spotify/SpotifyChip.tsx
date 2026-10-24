import { Music2 } from 'lucide-react';
import { useSpotify } from '../../store/spotify';
import { useUI } from '../../store/ui';

export function SpotifyChip() {
  const tokens = useSpotify((state) => state.tokens);
  const player = useSpotify((state) => state.player);
  const error = useSpotify((state) => state.error);
  const openSettings = useUI((state) => state.openSettings);

  // Now playing lives inside the search bar; this chip only surfaces errors.
  if (!tokens || player?.track || !error) return null;

  return (
    <button
      type="button"
      className="status-chip status-chip--spotify"
      title={error}
      onClick={() => openSettings('integrations')}
    >
      <Music2 aria-hidden="true" style={{ width: 14, height: 14 }} />
      <span className="status-chip__label">Spotify needs attention</span>
    </button>
  );
}
