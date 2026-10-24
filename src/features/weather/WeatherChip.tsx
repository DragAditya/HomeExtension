import { AlertCircle, Loader2, MapPin, RefreshCw, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  effectiveUnits,
  fetchWeather,
  formatTemp,
  formatTemperature,
  isWeatherFresh,
  readWeatherCache,
  relativeUpdated,
  weatherCacheKey,
  weatherLabel,
  writeWeatherCache,
} from '../../lib/weather';
import type { WeatherData } from '../../lib/settings/types';
import { useSettings } from '../../store/settings';
import { useUI } from '../../store/ui';
import { WeatherIcon } from './WeatherIcon';

function hourLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(11, 16);
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).format(date);
}

function dayLabel(iso: string, index: number): string {
  if (index === 0) return 'Today';
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date);
}

function cityShort(city: string): string {
  return city.split(',')[0]?.trim() || city;
}

export function WeatherChip() {
  const city = useSettings((state) => state.settings.widgets.weather.city);
  const latitude = useSettings((state) => state.settings.widgets.weather.latitude);
  const longitude = useSettings((state) => state.settings.widgets.weather.longitude);
  const units = useSettings((state) => state.settings.widgets.weather.units);
  const showForecast = useSettings((state) => state.settings.widgets.weather.forecast);
  const openSettings = useUI((state) => state.openSettings);

  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const forceRefresh = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasCoords = latitude !== null && longitude !== null;
  const resolvedUnits = effectiveUnits(units);

  useEffect(() => {
    if (!hasCoords || latitude === null || longitude === null) {
      setData(null);
      setLoading(false);
      setError(false);
      return;
    }
    const controller = new AbortController();
    let active = true;
    const key = weatherCacheKey(latitude, longitude, units);
    const force = forceRefresh.current;
    forceRefresh.current = false;

    const load = async () => {
      setLoading(true);
      setError(false);
      let cached: WeatherData | null = null;
      const cache = await readWeatherCache();
      if (cache?.key === key) {
        cached = cache.data;
        if (active) setData(cache.data);
        if (!force && isWeatherFresh(cache.data.fetchedAt)) {
          setLoading(false);
          return;
        }
      }
      try {
        const fresh = await fetchWeather(latitude, longitude, units, controller.signal);
        if (!active) return;
        setData(fresh);
        setError(false);
        setLoading(false);
        void writeWeatherCache(key, fresh);
      } catch {
        if (!active) return;
        setLoading(false);
        if (cached) {
          setData({ ...cached, stale: true });
        } else {
          setError(true);
        }
      }
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [hasCoords, latitude, longitude, units, refreshTick]);

  useEffect(() => {
    if (!hasCoords) return;
    const id = window.setInterval(() => setRefreshTick((tick) => tick + 1), 15 * 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        const fetchedAt = data?.fetchedAt ?? 0;
        if (!isWeatherFresh(fetchedAt)) setRefreshTick((tick) => tick + 1);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [data?.fetchedAt, hasCoords]);

  useEffect(() => {
    if (!open) return;
    const down = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', down);
    return () => window.removeEventListener('pointerdown', down);
  }, [open]);

  const refresh = () => {
    forceRefresh.current = true;
    setRefreshTick((tick) => tick + 1);
  };

  if (!hasCoords) {
    return (
      <button
        type="button"
        className="status-chip status-chip--quiet"
        onClick={() => openSettings('widgets')}
        title="Add a city for weather"
      >
        <MapPin aria-hidden="true" style={{ width: 14, height: 14 }} />
        <span>Set city</span>
      </button>
    );
  }

  const current = data?.current;
  return (
    <div className="weather" ref={containerRef}>
      <button
        type="button"
        className={`status-chip ${open ? 'status-chip--active' : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={city ? `${city} weather` : 'Weather'}
        onClick={() => setOpen((value) => !value)}
      >
        {current ? (
          <WeatherIcon code={current.code} isDay={current.isDay} size={15} />
        ) : loading ? (
          <Loader2 className="weather-chip__spinner" aria-hidden="true" />
        ) : (
          <AlertCircle aria-hidden="true" style={{ width: 14, height: 14 }} />
        )}
        <span className="status-chip__label">
          {current
            ? `${formatTemperature(current.temp)} ${cityShort(city)}`
            : loading
              ? 'Weather'
              : 'Weather —'}
        </span>
      </button>

      {open && (
        <div className="weather-popover popover" role="dialog" aria-label="Weather">
          <div className="weather-popover__head">
            <div className="weather-popover__place">
              <MapPin aria-hidden="true" />
              <span>{city}</span>
            </div>
            <div className="weather-popover__head-actions">
              <button
                type="button"
                className="icon-button icon-button--ghost"
                aria-label="Refresh weather"
                title="Refresh weather"
                onClick={refresh}
              >
                <RefreshCw
                  aria-hidden="true"
                  className={loading ? 'weather-chip__spinner' : undefined}
                />
              </button>
              <button
                type="button"
                className="icon-button icon-button--ghost"
                aria-label="Close weather"
                onClick={() => setOpen(false)}
              >
                <X aria-hidden="true" />
              </button>
            </div>
          </div>

          {!data && loading && (
            <div className="weather-popover__loading">
              <Loader2 aria-hidden="true" className="weather-chip__spinner" />
              <span>Reading the sky…</span>
            </div>
          )}

          {!data && error && !loading && (
            <div className="weather-popover__error">
              <AlertCircle aria-hidden="true" />
              <span>Weather is unavailable right now.</span>
              <button type="button" className="button button--small" onClick={refresh}>
                Try again
              </button>
            </div>
          )}

          {data && (
            <>
              <div className="weather-now">
                <div className="weather-now__icon">
                  <WeatherIcon code={data.current.code} isDay={data.current.isDay} size={40} />
                </div>
                <div className="weather-now__temp">{formatTemp(data.current.temp, resolvedUnits)}</div>
                <div className="weather-now__meta">
                  <strong>{weatherLabel(data.current.code)}</strong>
                  <span>Feels like {formatTemperature(data.current.feelsLike)}</span>
                </div>
              </div>

              <div className="weather-stats">
                <span>
                  <strong>{Math.round(data.current.humidity)}%</strong> humidity
                </span>
                <span>
                  <strong>{Math.round(data.current.wind)}</strong> {resolvedUnits === 'f' ? 'mph' : 'km/h'}
                </span>
                {data.stale && <span className="weather-stale">Offline data</span>}
              </div>

              <div className="weather-hourly" aria-label="Next 12 hours">
                {data.hourly.map((hour) => (
                  <div key={hour.time} className="weather-hour">
                    <span>{hourLabel(hour.time)}</span>
                    <WeatherIcon code={hour.code} isDay={data.current.isDay} size={16} />
                    <strong>{formatTemperature(hour.temp)}</strong>
                    {hour.precip > 0 && <small>{Math.round(hour.precip)}%</small>}
                  </div>
                ))}
              </div>

              {showForecast && (
                <div className="weather-daily">
                  {data.daily.map((day, index) => (
                    <div key={day.date} className="weather-day">
                      <span>{dayLabel(day.date, index)}</span>
                      <WeatherIcon code={day.code} isDay size={15} />
                      <span className="weather-day__low">{formatTemperature(day.low)}</span>
                      <strong>{formatTemperature(day.high)}</strong>
                    </div>
                  ))}
                </div>
              )}

              <div className="weather-popover__foot">
                <span>{relativeUpdated(data.fetchedAt)}</span>
                <span>Open-Meteo</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
