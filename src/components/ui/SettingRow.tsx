import { RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { getValue } from '../../lib/settings/paths';
import { getSettingMeta } from '../../lib/settings/registry';
import { useSettings } from '../../store/settings';
import { useUI } from '../../store/ui';

type SettingRowProps = {
  path: string;
  children: ReactNode;
  label?: string;
  help?: string;
  showReset?: boolean;
  hide?: boolean;
};

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function SettingRow({
  path,
  children,
  label,
  help,
  showReset = true,
  hide = false,
}: SettingRowProps) {
  const meta = getSettingMeta(path);
  const advanced = useUI((state) => state.advanced);
  const value = useSettings((state) => getValue(state.settings, path));
  const reset = useSettings((state) => state.reset);

  if (!meta || hide) return null;
  if (meta.advanced && !advanced) return null;

  const modified = !same(value, meta.defaultValue);

  return (
    <div className={`setting-row ${modified ? 'setting-row--modified' : ''}`}>
      <div className="setting-row__copy">
        <span className="setting-row__label">{label ?? meta.label}</span>
        {(help ?? meta.help) && <div className="setting-row__help">{help ?? meta.help}</div>}
      </div>
      <div className="setting-row__control">
        {children}
        {showReset && (
          <button
            type="button"
            className="setting-row__reset"
            aria-label={`Reset ${meta.label}`}
            title={`Reset ${meta.label}`}
            disabled={!modified}
            onClick={() => reset(path)}
          >
            <RotateCcw aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
