import { Music2, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { useNow } from '../../lib/useNow';
import { useSpotify } from '../../store/spotify';

function formatTrackTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function SpotifyPlayer() {
  const player = useSpotify((state) => state.player);
  const control = useSpotify((state) => state.control);
  const syncing = useSpotify((state) => state.syncing);
  const error = useSpotify((state) => state.error);
  const lastSynced = useSpotify((state) => state.lastSynced);
  const now = useNow(1000);

  const track = player?.track;
  if (!track) return null;

  const elapsed = Math.min(
    track.durationMs,
    player.progressMs +
      (player.isPlaying ? Math.max(0, now.getTime() - (lastSynced ?? now.getTime())) : 0),
  );
  const progress = track.durationMs > 0 ? (elapsed / track.durationMs) * 100 : 0;

  return (
    <div
      className={`search__player ${player.isPlaying ? 'search__player--playing' : ''}`}
      role="group"
      aria-label="Spotify player"
    >
      <button
        type="button"
        className="search__player-art"
        aria-label={track.url ? 'Open this track in Spotify' : track.name}
        title={track.url ? 'Open in Spotify' : track.name}
        onClick={() => {
          if (track.url) window.open(track.url, '_blank', 'noopener,noreferrer');
        }}
      >
        {track.image ? (
          <img src={track.image} alt="" referrerPolicy="no-referrer" />
        ) : (
          <Music2 aria-hidden="true" />
        )}
      </button>

      <div className="search__player-meta" aria-live="polite">
        <strong title={track.name}>{track.name}</strong>
        <span className="search__player-artist" title={track.artists}>
          {track.artists}
        </span>
      </div>

      <div className="search__player-progress">
        <div
          className="search__player-rail"
          role="progressbar"
          aria-label="Track progress"
          aria-valuemin={0}
          aria-valuemax={track.durationMs}
          aria-valuenow={Math.round(elapsed)}
        >
          <span style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
        <div className="search__player-times" aria-hidden="true">
          <span>{formatTrackTime(elapsed)}</span>
          <span>{formatTrackTime(track.durationMs)}</span>
        </div>
      </div>

      <div className="search__player-controls">
        <button
          type="button"
          className="search__player-control"
          aria-label="Previous track"
          title="Previous"
          onClick={() => void control('previous')}
        >
          <SkipBack aria-hidden="true" />
        </button>
        <button
          type="button"
          className="search__player-control search__player-control--play"
          aria-label={player.isPlaying ? 'Pause Spotify' : 'Play Spotify'}
          title={player.isPlaying ? 'Pause' : 'Play'}
          onClick={() => void control(player.isPlaying ? 'pause' : 'play')}
        >
          {player.isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </button>
        <button
          type="button"
          className="search__player-control"
          aria-label="Next track"
          title="Next"
          onClick={() => void control('next')}
        >
          <SkipForward aria-hidden="true" />
        </button>
      </div>

      <span
        className={`search__player-source ${
          player.isPlaying ? 'search__player-source--playing' : ''
        } ${syncing ? 'search__player-source--syncing' : ''}`}
        title={error ?? 'Spotify'}
      >
        <i aria-hidden="true" />
        <span>Spotify</span>
      </span>
    </div>
  );
}
