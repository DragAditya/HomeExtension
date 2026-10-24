import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  Music2,
  Unplug,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ConfirmButton } from '../../../components/ui/ConfirmButton';
import { hasIdentityApi, spotifyRedirectUri } from '../../../lib/spotify';
import { useSettings } from '../../../store/settings';
import { useSpotify } from '../../../store/spotify';
import { useUI } from '../../../store/ui';

const CLIENT_ID_PATTERN = /^[A-Za-z0-9]{20,128}$/;

export function SpotifyCard() {
  const storedClientId = useSettings((state) => state.settings.integrations.spotifyClientId);
  const set = useSettings((state) => state.set);
  const tokens = useSpotify((state) => state.tokens);
  const player = useSpotify((state) => state.player);
  const connecting = useSpotify((state) => state.connecting);
  const error = useSpotify((state) => state.error);
  const connect = useSpotify((state) => state.connect);
  const disconnect = useSpotify((state) => state.disconnect);
  const toast = useUI((state) => state.toast);

  const [draft, setDraft] = useState(storedClientId);
  const [invalid, setInvalid] = useState(false);
  const [copied, setCopied] = useState(false);
  const redirectUri = spotifyRedirectUri();
  const identity = hasIdentityApi();

  useEffect(() => {
    setDraft(storedClientId);
  }, [storedClientId]);

  const commit = () => {
    const clean = draft.trim();
    if (clean && !CLIENT_ID_PATTERN.test(clean)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    if (clean !== storedClientId) set('integrations.spotifyClientId', clean);
  };

  const copyRedirect = async () => {
    try {
      await navigator.clipboard.writeText(redirectUri);
      setCopied(true);
      toast('Redirect URI copied.', 'success');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast('Could not copy the redirect URI.', 'error');
    }
  };

  const connected = Boolean(tokens);
  const clientValid = CLIENT_ID_PATTERN.test(storedClientId);

  return (
    <div className={`spotify-card ${connected ? 'spotify-card--connected' : ''}`}>
      <div className="spotify-card__head">
        <span className="spotify-card__mark">
          <Music2 aria-hidden="true" />
        </span>
        <div className="spotify-card__title">
          <strong>Spotify</strong>
          <span>
            {connected
              ? player?.deviceName
                ? `Connected · ${player.deviceName}`
                : 'Connected'
              : 'Your music, on the new tab.'}
          </span>
        </div>
        {connected && (
          <span className="spotify-card__status">
            <span className="spotify-card__status-dot" /> Connected
          </span>
        )}
      </div>

      {error && (
        <div className="spotify-card__error">
          <AlertCircle aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {connected ? (
        <div className="spotify-card__connected">
          <div className="spotify-card__now">
            {player?.track ? (
              <>
                <span className="spotify-card__art">
                  {player.track.image ? (
                    <img src={player.track.image} alt="" referrerPolicy="no-referrer" />
                  ) : (
                    <Music2 aria-hidden="true" />
                  )}
                </span>
                <span>
                  <strong>{player.track.name}</strong>
                  <small>{player.track.artists}</small>
                </span>
              </>
            ) : (
              <span className="spotify-card__muted">
                <Music2 aria-hidden="true" /> Nothing playing right now.
              </span>
            )}
          </div>
          <div className="spotify-card__actions">
            <button
              type="button"
              className="button button--small"
              onClick={() => window.open('https://open.spotify.com', '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink aria-hidden="true" />
              Open Spotify
            </button>
            <ConfirmButton
              className="button button--small button--danger"
              confirmLabel="Disconnect?"
              onConfirm={() => void disconnect()}
            >
              <Unplug aria-hidden="true" />
              Disconnect
            </ConfirmButton>
          </div>
        </div>
      ) : (
        <>
          <ol className="spotify-steps">
            <li>
              Create an app in the{' '}
              <a
                href="https://developer.spotify.com/dashboard"
                target="_blank"
                rel="noreferrer noopener"
              >
                Spotify Developer Dashboard <ExternalLink aria-hidden="true" />
              </a>
              .
            </li>
            <li>Add the redirect URI below exactly, then paste the client ID.</li>
            <li>Connect and open Spotify on a phone or desktop to start playback.</li>
          </ol>

          <div className="spotify-card__field">
            <label htmlFor="spotify-client-id">Client ID</label>
            <input
              id="spotify-client-id"
              value={draft}
              placeholder="Paste your app's client ID"
              spellCheck={false}
              autoComplete="off"
              aria-invalid={invalid}
              onChange={(event) => {
                setDraft(event.target.value);
                if (invalid) setInvalid(false);
              }}
              onBlur={commit}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  commit();
                  event.currentTarget.blur();
                }
              }}
            />
            {invalid && <span className="spotify-card__hint-error">That does not look like a Spotify client ID.</span>}
          </div>

          <div className="spotify-card__redirect">
            <div className="spotify-card__redirect-copy">
              <span>
                <Link2 aria-hidden="true" /> Redirect URI
              </span>
              <code>{redirectUri || 'Unavailable outside the extension'}</code>
            </div>
            <button
              type="button"
              className="button button--small"
              disabled={!redirectUri}
              onClick={() => void copyRedirect()}
            >
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {!identity && (
            <p className="spotify-card__notice">
              Connecting needs the installed Chrome extension. This preview can still save a client ID.
            </p>
          )}

          <button
            type="button"
            className="button button--primary spotify-card__connect"
            disabled={!clientValid || connecting || !identity}
            onClick={() => void connect()}
          >
            {connecting ? <Loader2 aria-hidden="true" className="spin" /> : <Music2 aria-hidden="true" />}
            {connecting ? 'Waiting for Spotify…' : 'Connect Spotify'}
          </button>
        </>
      )}
    </div>
  );
}
