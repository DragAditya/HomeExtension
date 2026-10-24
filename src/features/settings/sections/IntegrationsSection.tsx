import { CloudSun, ShieldCheck } from 'lucide-react';
import { SpotifyCard } from '../controls/SpotifyCard';

export function IntegrationsSection() {
  return (
    <div className="settings-section">
      <SpotifyCard />

      <div className="integration-built">
        <span className="integration-built__icon">
          <CloudSun aria-hidden="true" />
        </span>
        <span className="integration-built__copy">
          <strong>Open-Meteo</strong>
          <span>Forecast and city search. No API key, no account, no location permission.</span>
        </span>
        <span className="integration-built__status">Built in</span>
      </div>

      <div className="integration-built">
        <span className="integration-built__icon">
          <ShieldCheck aria-hidden="true" />
        </span>
        <span className="integration-built__copy">
          <strong>Search suggestions</strong>
          <span>Queries go directly from this tab to your chosen search engine.</span>
        </span>
        <span className="integration-built__status">Optional</span>
      </div>

      <p className="settings-privacy-statement">
        Lumen has no analytics, no remote code, and no account of its own. Spotify tokens stay in
        this browser&apos;s extension storage and are sent only to Spotify.
      </p>
    </div>
  );
}
