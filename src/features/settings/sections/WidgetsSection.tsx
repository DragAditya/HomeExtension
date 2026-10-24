import { MapPin, ShieldCheck, StickyNote, Timer } from 'lucide-react';
import { ConfirmButton } from '../../../components/ui/ConfirmButton';
import { useFocus } from '../../../store/focus';
import { useSettings } from '../../../store/settings';
import { useUI } from '../../../store/ui';
import { CityPicker } from '../controls/CityPicker';
import { Row, SettingsGroup } from './parts';

export function WidgetsSection() {
  const notes = useSettings((state) => state.settings.widgets.notes.text);
  const set = useSettings((state) => state.set);
  const sessions = useFocus((state) => state.state.sessionsToday);
  const openNotes = useUI((state) => state.openNotes);
  const toast = useUI((state) => state.toast);

  return (
    <div className="settings-section">
      <SettingsGroup
        title="Weather"
        description="City search only. Lumen never asks for your precise location."
      >
        <div className="settings-custom-row settings-custom-row--stack">
          <div className="settings-custom-row__copy">
            <span className="settings-custom-row__label">City</span>
            <span className="settings-custom-row__help">Open-Meteo provides the forecast.</span>
          </div>
          <CityPicker />
        </div>
        <Row path="widgets.weather.units" />
        <Row path="widgets.weather.forecast" />
      </SettingsGroup>

      <SettingsGroup
        title="Focus"
        description="A deadline-based timer survives reloads, sleep, and closed tabs."
      >
        <div className="widget-stat">
          <span className="widget-stat__icon">
            <Timer aria-hidden="true" />
          </span>
          <span>
            <strong>{sessions}</strong>
            <small>{sessions === 1 ? 'focus session today' : 'focus sessions today'}</small>
          </span>
        </div>
        <Row path="widgets.focus.workMinutes" />
        <Row path="widgets.focus.breakMinutes" />
        <Row path="widgets.focus.autoCycle" />
        <Row path="widgets.focus.chime" />
      </SettingsGroup>

      <SettingsGroup
        title="Quick notes"
        description="Plain text, autosaved locally. Nothing leaves this browser."
      >
        <div className="notes-setting">
          <div className="notes-setting__preview">
            <StickyNote aria-hidden="true" />
            <span>
              {notes.trim()
                ? `${notes.trim().slice(0, 140)}${notes.trim().length > 140 ? '…' : ''}`
                : 'Nothing written yet.'}
            </span>
          </div>
          <div className="notes-setting__actions">
            <button type="button" className="button button--small" onClick={openNotes}>
              Open notes
            </button>
            <ConfirmButton
              className="button button--small button--danger"
              confirmLabel="Clear notes?"
              disabled={!notes}
              onConfirm={() => {
                set('widgets.notes.text', '');
                toast('Quick notes cleared.');
              }}
            >
              Clear
            </ConfirmButton>
          </div>
        </div>
        <div className="settings-privacy-line">
          <ShieldCheck aria-hidden="true" />
          <span>Notes are included in your Lumen backup.</span>
        </div>
      </SettingsGroup>

      <div className="settings-note">
        <MapPin aria-hidden="true" />
        <div>
          <strong>No location permission.</strong>
          <span>Weather coordinates are only the city you choose, stored with the rest of your settings.</span>
        </div>
      </div>
    </div>
  );
}
