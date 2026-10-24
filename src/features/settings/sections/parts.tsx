import type { ReactNode } from 'react';
import { SettingRow } from '../../../components/ui/SettingRow';
import { SettingControl } from '../controls/SettingControl';

export function SettingsGroup({
  title,
  description,
  children,
  advanced = false,
  visible = true,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  advanced?: boolean;
  visible?: boolean;
}) {
  if (!visible) return null;
  return (
    <section className={`settings-group ${advanced ? 'settings-group--advanced' : ''}`}>
      <div className="settings-group__head">
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      <div className="settings-group__body">{children}</div>
    </section>
  );
}

export function Row({ path, label, help }: { path: string; label?: string; help?: string }) {
  return (
    <SettingRow path={path} label={label} help={help}>
      <SettingControl path={path} />
    </SettingRow>
  );
}
