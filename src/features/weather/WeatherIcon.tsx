import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from 'lucide-react';
import { weatherKind } from '../../lib/weather';

type WeatherIconProps = {
  code: number;
  isDay?: boolean;
  size?: number;
};

export function WeatherIcon({ code, isDay = true, size = 16 }: WeatherIconProps) {
  const kind = weatherKind(code, isDay);
  const props = {
    width: size,
    height: size,
    strokeWidth: 1.7,
    'aria-hidden': true as const,
  };
  if (kind === 'clear') return isDay ? <Sun {...props} /> : <Moon {...props} />;
  if (kind === 'partly') return isDay ? <CloudSun {...props} /> : <CloudMoon {...props} />;
  if (kind === 'fog') return <CloudFog {...props} />;
  if (kind === 'rain') return <CloudRain {...props} />;
  if (kind === 'snow') return <CloudSnow {...props} />;
  if (kind === 'storm') return <CloudLightning {...props} />;
  return <Cloud {...props} />;
}
