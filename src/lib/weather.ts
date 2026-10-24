import { storageGet, storageSet } from './storage';
import type { CityResult, Units, WeatherData } from './settings/types';

const WEATHER_KEY = 'lumen.weather.cache';
const CACHE_MS = 15 * 60 * 1000;

type OpenMeteoCurrent = {
  time: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  weather_code: number;
  wind_speed_10m: number;
  is_day: number;
};

type OpenMeteoHourly = {
  time: string[];
  temperature_2m: number[];
  weather_code: number[];
  precipitation_probability: number[];
};

type OpenMeteoDaily = {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  sunrise: string[];
  sunset: string[];
};

type OpenMeteoResponse = {
  current: OpenMeteoCurrent;
  hourly: OpenMeteoHourly;
  daily: OpenMeteoDaily;
};

type GeoResponse = {
  results?: Array<{
    id: number;
    name: string;
    country: string;
    admin1?: string;
    latitude: number;
    longitude: number;
    timezone?: string;
  }>;
};

export type WeatherCache = {
  key: string;
  data: WeatherData;
};

export function effectiveUnits(units: Units): 'c' | 'f' {
  if (units === 'c' || units === 'f') return units;
  const locale = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'en-us';
  return locale === 'en-us' || locale.endsWith('-us') ? 'f' : 'c';
}

export function weatherCacheKey(latitude: number, longitude: number, units: Units): string {
  return `${latitude.toFixed(3)},${longitude.toFixed(3)}:${effectiveUnits(units)}`;
}

export function isWeatherFresh(fetchedAt: number, now = Date.now()): boolean {
  return now - fetchedAt < CACHE_MS;
}

export async function searchCity(query: string, signal: AbortSignal): Promise<CityResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const url =
    'https://geocoding-api.open-meteo.com/v1/search?name=' +
    encodeURIComponent(trimmed) +
    '&count=6&language=en&format=json';
  const response = await fetch(url, { signal, credentials: 'omit', cache: 'no-store' });
  if (!response.ok) throw new Error('City search is unavailable');
  const data = (await response.json()) as GeoResponse;
  return (data.results ?? []).map((city) => ({
    id: city.id,
    name: city.name,
    country: city.country,
    admin1: city.admin1,
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: city.timezone,
  }));
}

export async function fetchWeather(
  latitude: number,
  longitude: number,
  units: Units,
  signal: AbortSignal,
): Promise<WeatherData> {
  const resolved = effectiveUnits(units);
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
    hourly: 'temperature_2m,weather_code,precipitation_probability',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
    timezone: 'auto',
    forecast_days: '5',
  });
  if (resolved === 'f') {
    params.set('temperature_unit', 'fahrenheit');
    params.set('wind_speed_unit', 'mph');
  }
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
    signal,
    credentials: 'omit',
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Weather is unavailable');
  const data = (await response.json()) as OpenMeteoResponse;
  return mapWeather(data, resolved);
}

export function mapWeather(data: OpenMeteoResponse, units: 'c' | 'f'): WeatherData {
  const startIndex = Math.max(
    0,
    data.hourly.time.findIndex((time) => time >= data.current.time),
  );
  const hourly = data.hourly.time
    .slice(startIndex, startIndex + 12)
    .map((time, offset) => ({
      time,
      temp: data.hourly.temperature_2m[startIndex + offset] ?? data.current.temperature_2m,
      code: data.hourly.weather_code[startIndex + offset] ?? data.current.weather_code,
      precip: data.hourly.precipitation_probability[startIndex + offset] ?? 0,
    }));
  const daily = data.daily.time.slice(0, 5).map((date, index) => ({
    date,
    code: data.daily.weather_code[index] ?? 0,
    high: data.daily.temperature_2m_max[index] ?? data.current.temperature_2m,
    low: data.daily.temperature_2m_min[index] ?? data.current.temperature_2m,
    sunrise: data.daily.sunrise[index],
    sunset: data.daily.sunset[index],
  }));
  return {
    current: {
      temp: data.current.temperature_2m,
      feelsLike: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      wind: data.current.wind_speed_10m,
      code: data.current.weather_code,
      isDay: data.current.is_day === 1,
    },
    hourly,
    daily,
    fetchedAt: Date.now(),
    units,
  };
}

export function weatherLabel(code: number): string {
  if (code === 0) return 'Clear';
  if (code === 1) return 'Mostly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Fog';
  if (code === 51 || code === 53 || code === 55) return 'Drizzle';
  if (code === 56 || code === 57) return 'Freezing drizzle';
  if (code === 61 || code === 63 || code === 65) return 'Rain';
  if (code === 66 || code === 67) return 'Freezing rain';
  if (code === 71 || code === 73 || code === 75) return 'Snow';
  if (code === 77) return 'Snow grains';
  if (code === 80 || code === 81 || code === 82) return 'Showers';
  if (code === 85 || code === 86) return 'Snow showers';
  if (code === 95) return 'Thunderstorm';
  if (code === 96 || code === 99) return 'Thunderstorm with hail';
  return 'Unsettled';
}

export function weatherKind(
  code: number,
  isDay = true,
): 'clear' | 'partly' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm' {
  if (code === 0) return 'clear';
  if (code === 1 || code === 2) return isDay ? 'partly' : 'cloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'cloudy';
}

export function formatTemp(value: number, units: 'c' | 'f'): string {
  return `${Math.round(value)}°${units.toUpperCase()}`;
}

export function formatTemperature(value: number): string {
  return `${Math.round(value)}°`;
}

export function cityLabel(city: CityResult): string {
  const region = city.admin1 ? `${city.admin1}, ` : '';
  return `${city.name}, ${region}${city.country}`;
}

export async function readWeatherCache(): Promise<WeatherCache | null> {
  try {
    const stored = await storageGet<unknown>(WEATHER_KEY);
    if (!stored || typeof stored !== 'object') return null;
    const candidate = stored as WeatherCache;
    if (typeof candidate.key !== 'string' || !candidate.data) return null;
    return candidate;
  } catch {
    return null;
  }
}

export async function writeWeatherCache(key: string, data: WeatherData): Promise<void> {
  try {
    await storageSet(WEATHER_KEY, { key, data } satisfies WeatherCache);
  } catch {
    // Caching is best-effort.
  }
}

export function relativeUpdated(fetchedAt: number, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - fetchedAt) / 60000));
  if (minutes < 1) return 'Updated just now';
  if (minutes === 1) return 'Updated 1 min ago';
  if (minutes < 60) return `Updated ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `Updated ${hours} hr ago`;
}
