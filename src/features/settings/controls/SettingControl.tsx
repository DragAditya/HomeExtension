import { ColorField } from '../../../components/ui/ColorField';
import { Segmented } from '../../../components/ui/Segmented';
import { SelectField } from '../../../components/ui/SelectField';
import { Slider } from '../../../components/ui/Slider';
import { TextField } from '../../../components/ui/TextField';
import { Toggle } from '../../../components/ui/Toggle';
import { getValue } from '../../../lib/settings/paths';
import { getSettingMeta } from '../../../lib/settings/registry';
import { isValidTemplate } from '../../../lib/settings/normalize';
import { useSettings } from '../../../store/settings';

function validateFor(path: string, value: string): string | null {
  if (path === 'search.customEngine.urlTemplate') {
    if (!value) return 'Enter a URL template.';
    if (!isValidTemplate(value)) return 'Use a full URL with %s where the query goes.';
  }
  if (path === 'integrations.spotifyClientId' && value) {
    if (!/^[A-Za-z0-9]{20,128}$/.test(value)) return 'Use the client ID from your Spotify app.';
  }
  return null;
}

export function SettingControl({ path }: { path: string }) {
  const meta = getSettingMeta(path);
  const value = useSettings((state) => getValue(state.settings, path));
  const set = useSettings((state) => state.set);
  const glassIntensity = useSettings((state) => state.settings.appearance.glassIntensity);

  if (!meta) return null;

  switch (meta.kind) {
    case 'toggle':
      return (
        <Toggle
          checked={Boolean(value)}
          label={meta.label}
          onChange={(checked) => set(path, checked)}
        />
      );
    case 'slider':
      return (
        <Slider
          value={Number(value)}
          min={meta.min ?? 0}
          max={meta.max ?? 100}
          step={meta.step ?? 1}
          unit={meta.unit}
          label={meta.label}
          onChange={(next) => set(path, next)}
        />
      );
    case 'segmented':
      return (
        <Segmented
          value={value as string | number}
          options={meta.options ?? []}
          label={meta.label}
          onChange={(next) => set(path, next)}
        />
      );
    case 'select':
      return (
        <SelectField
          value={value as string | number}
          options={meta.options ?? []}
          label={meta.label}
          onChange={(next) => set(path, next)}
        />
      );
    case 'color':
      return (
        <ColorField
          value={String(value)}
          label={meta.label}
          onChange={(next) => set(path, next)}
        />
      );
    case 'text':
      return (
        <TextField
          value={String(value ?? '')}
          placeholder={meta.placeholder}
          maxLength={meta.maxLength}
          label={meta.label}
          validate={(next) => validateFor(path, next)}
          onChange={(next) => set(path, next)}
        />
      );
    case 'override': {
      const custom = value !== null && value !== undefined;
      return (
        <div className="override-control">
          <span className="override-control__state">
            {custom ? `${Number(value)}%` : 'Inherits global'}
          </span>
          <Toggle
            checked={custom}
            label={`${meta.label} custom intensity`}
            onChange={(checked) => set(path, checked ? glassIntensity : null)}
          />
          {custom && (
            <Slider
              value={Number(value)}
              min={0}
              max={100}
              step={1}
              unit="%"
              label={`${meta.label} intensity`}
              onChange={(next) => set(path, next)}
            />
          )}
        </div>
      );
    }
    default:
      return null;
  }
}
