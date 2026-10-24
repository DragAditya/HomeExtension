import { Check, Loader2, MapPin, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CityResult } from '../../../lib/settings/types';
import { cityLabel, searchCity } from '../../../lib/weather';
import { useSettings } from '../../../store/settings';

export function CityPicker() {
  const city = useSettings((state) => state.settings.widgets.weather.city);
  const latitude = useSettings((state) => state.settings.widgets.weather.latitude);
  const setMany = useSettings((state) => state.setMany);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setError(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    const timer = window.setTimeout(() => {
      void searchCity(trimmed, controller.signal)
        .then((cities) => {
          if (controller.signal.aborted) return;
          setResults(cities);
          setLoading(false);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setResults([]);
          setLoading(false);
          setError(true);
        });
    }, 320);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const choose = (result: CityResult) => {
    setMany([
      ['widgets.weather.city', cityLabel(result)],
      ['widgets.weather.latitude', result.latitude],
      ['widgets.weather.longitude', result.longitude],
    ]);
    setQuery('');
    setResults([]);
  };

  const clear = () => {
    setMany([
      ['widgets.weather.city', ''],
      ['widgets.weather.latitude', null],
      ['widgets.weather.longitude', null],
    ]);
  };

  return (
    <div className="city-picker">
      {city && latitude !== null ? (
        <div className="city-picker__current">
          <span className="city-picker__place">
            <MapPin aria-hidden="true" />
            <span>{city}</span>
          </span>
          <button
            type="button"
            className="icon-button icon-button--ghost"
            aria-label="Clear weather city"
            title="Clear city"
            onClick={clear}
          >
            <X aria-hidden="true" />
          </button>
        </div>
      ) : (
        <p className="city-picker__hint">No city set. Weather stays hidden until you choose one.</p>
      )}
      <div className="city-picker__search">
        <Search aria-hidden="true" />
        <input
          type="search"
          value={query}
          placeholder="Search for a city…"
          aria-label="Search for a weather city"
          onChange={(event) => setQuery(event.target.value)}
        />
        {loading && <Loader2 aria-hidden="true" className="weather-chip__spinner" />}
      </div>
      {error && <p className="city-picker__error">City search is unavailable. Try again.</p>}
      {!error && query.trim().length >= 2 && !loading && results.length === 0 && (
        <p className="city-picker__empty">No matching cities.</p>
      )}
      {results.length > 0 && (
        <div className="city-picker__results" role="listbox" aria-label="City results">
          {results.map((result) => (
            <button
              key={`${result.id}-${result.latitude}`}
              type="button"
              className="city-picker__result"
              role="option"
              aria-selected={city === cityLabel(result)}
              onClick={() => choose(result)}
            >
              <span>
                <strong>{result.name}</strong>
                <small>
                  {result.admin1 ? `${result.admin1}, ` : ''}
                  {result.country}
                </small>
              </span>
              {city === cityLabel(result) && <Check aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
