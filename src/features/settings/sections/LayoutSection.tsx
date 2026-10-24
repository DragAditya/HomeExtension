import type { CSSProperties } from 'react';
import { useSettings } from '../../../store/settings';
import { Row, SettingsGroup } from './parts';

function LayoutPreview() {
  const settings = useSettings((state) => state.settings);
  const widgets = settings.layout.widgets;
  const dock = widgets.spotify || widgets.focus || widgets.notes;
  return (
    <div className="layout-preview" data-align={settings.layout.alignment} aria-hidden="true">
      <div className="layout-preview__rail">
        <span className="layout-preview__chips">
          {widgets.weather && <i />}
          {widgets.spotify && <i />}
          {widgets.focus && <i />}
        </span>
        <span className="layout-preview__gear" />
      </div>
      <div className="layout-preview__stage">
        <div className="layout-preview__stack">
          {widgets.greeting && <i className="layout-preview__greeting" />}
          {widgets.clock && <i className="layout-preview__clock" />}
          {widgets.date && <i className="layout-preview__date" />}
        </div>
        {widgets.search && <span className="layout-preview__search" />}
        {widgets.shortcuts && (
          <span
            className="layout-preview__grid"
            style={{ '--preview-cols': settings.layout.shortcutColumns } as CSSProperties}
          >
            {Array.from({ length: Math.min(8, settings.shortcuts.length) }).map((_, index) => (
              <i key={index} />
            ))}
          </span>
        )}
      </div>
      {dock && (
        <div className="layout-preview__dock">
          {widgets.spotify && <i className="layout-preview__dock-wide" />}
          {widgets.focus && <i />}
          {widgets.notes && <i />}
        </div>
      )}
      <span className="layout-preview__label">Live layout</span>
    </div>
  );
}

export function LayoutSection() {
  return (
    <div className="settings-section">
      <LayoutPreview />

      <SettingsGroup title="Stage" description="Where the clock and search sit, and who they greet.">
        <Row path="layout.alignment" />
        <Row path="profile.name" />
      </SettingsGroup>

      <SettingsGroup title="Time" description="The clock and date read live on the stage.">
        <Row path="layout.hour12" />
        <Row path="layout.showSeconds" />
        <Row path="layout.dateStyle" />
      </SettingsGroup>

      <SettingsGroup title="Grid" description="Columns set the row width; narrow windows wrap naturally.">
        <Row path="layout.shortcutColumns" />
      </SettingsGroup>

      <SettingsGroup
        title="Widgets"
        description="The dock appears only when Spotify, focus, or notes is on."
      >
        <Row path="layout.widgets.greeting" />
        <Row path="layout.widgets.clock" />
        <Row path="layout.widgets.date" />
        <Row path="layout.widgets.search" />
        <Row path="layout.widgets.shortcuts" />
        <Row path="layout.widgets.weather" />
        <Row path="layout.widgets.spotify" />
        <Row path="layout.widgets.focus" />
        <Row path="layout.widgets.notes" />
      </SettingsGroup>
    </div>
  );
}
