import { ExternalLink, Search } from 'lucide-react';
import { buildSearchUrl, SEARCH_ENGINES } from '../../../lib/search';
import { useSettings } from '../../../store/settings';
import { useUI } from '../../../store/ui';
import { Row, SettingsGroup } from './parts';

export function SearchSection() {
  const engine = useSettings((state) => state.settings.search.engine);
  const customEngine = useSettings((state) => state.settings.search.customEngine);
  const openInNewTab = useSettings((state) => state.settings.search.openInNewTab);
  const toast = useUI((state) => state.toast);
  const sample = buildSearchUrl(engine, 'aurora glass', customEngine);
  const label = engine === 'custom' ? customEngine.name || 'Custom' : SEARCH_ENGINES[engine].label;

  return (
    <div className="settings-section">
      <SettingsGroup title="Engine" description="Search directly from the stage with the engine you trust.">
        <Row path="search.engine" />
        <Row path="search.suggestions" />
        <Row path="search.recentSearches" />
        <Row path="search.openInNewTab" />
        <Row path="search.autofocus" />
      </SettingsGroup>

      {engine === 'custom' ? (
        <SettingsGroup
          title="Custom engine"
          description="Use %s where the encoded query belongs."
        >
          <Row path="search.customEngine.name" />
          <Row path="search.customEngine.urlTemplate" />
        </SettingsGroup>
      ) : (
        <div className="settings-note">
          <Search aria-hidden="true" />
          <div>
            <strong>Want another engine?</strong>
            <span>Choose Custom in the Engine row to name it and paste a URL template.</span>
          </div>
        </div>
      )}

      <div className="search-preview-card">
        <div className="search-preview-card__head">
          <span className="settings-block__eyebrow">
            <Search aria-hidden="true" /> Search preview
          </span>
          <span className="settings-block__aside">{openInNewTab ? 'Opens in a new tab' : 'Opens in this tab'}</span>
        </div>
        <div className="search-preview-card__bar">
          <Search aria-hidden="true" />
          <span>aurora glass</span>
          <b>{label}</b>
        </div>
        <code title={sample}>{sample}</code>
        <button
          type="button"
          className="button button--small"
          onClick={() => {
            window.open(sample, '_blank', 'noopener,noreferrer');
            toast('Search preview opened.');
          }}
        >
          <ExternalLink aria-hidden="true" />
          Try a search
        </button>
      </div>
    </div>
  );
}
