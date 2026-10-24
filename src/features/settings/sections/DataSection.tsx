import {
  Database,
  Download,
  FileJson,
  HardDrive,
  History,
  Lock,
  RotateCcw,
  StickyNote,
  Upload,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ConfirmButton } from '../../../components/ui/ConfirmButton';
import { backupFilename, formatBytes, parseBackup, serializeBackup } from '../../../lib/backup';
import { estimateStorage } from '../../../lib/idb';
import { clearRecentSearches } from '../../../lib/searchHistory';
import { storageBytes } from '../../../lib/storage';
import { useSettings } from '../../../store/settings';
import { useUI } from '../../../store/ui';

export function DataSection() {
  const settings = useSettings((state) => state.settings);
  const replace = useSettings((state) => state.replace);
  const resetAll = useSettings((state) => state.resetAll);
  const set = useSettings((state) => state.set);
  const advanced = useUI((state) => state.advanced);
  const toggleAdvanced = useUI((state) => state.toggleAdvanced);
  const toast = useUI((state) => state.toast);
  const inputRef = useRef<HTMLInputElement>(null);
  const [localBytes, setLocalBytes] = useState(0);
  const [quota, setQuota] = useState(0);
  const [browserUsage, setBrowserUsage] = useState(0);

  const readStats = async () => {
    const [stored, estimate] = await Promise.all([storageBytes(), estimateStorage()]);
    setLocalBytes(stored);
    setBrowserUsage(estimate?.usage ?? 0);
    setQuota(estimate?.quota ?? 0);
  };

  useEffect(() => {
    void readStats();
  }, []);

  const exportBackup = () => {
    const blob = new Blob([serializeBackup(settings)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = backupFilename();
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Backup downloaded.', 'success');
  };

  const importBackup = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast('That backup is too large to import.', 'error');
      return;
    }
    let text = '';
    try {
      text = await file.text();
    } catch {
      toast('That file could not be read.', 'error');
      return;
    }
    const parsed = parseBackup(text);
    if (!parsed.ok) {
      toast(parsed.error, 'error');
      return;
    }
    replace(parsed.settings);
    toast('Backup imported. Reconnect Spotify if your redirect URI changed.', 'success');
    window.setTimeout(() => void readStats(), 400);
    if (inputRef.current) inputRef.current.value = '';
  };

  const usagePercent = quota > 0 ? Math.min(100, (browserUsage / quota) * 100) : 0;

  return (
    <div className="settings-section">
      <div className="data-card">
        <div className="data-card__head">
          <span className="data-card__icon">
            <FileJson aria-hidden="true" />
          </span>
          <div>
            <strong>Backup</strong>
            <span>One readable JSON file with settings, shortcuts, notes, and widget choices.</span>
          </div>
        </div>
        <div className="data-card__actions">
          <button type="button" className="button button--primary" onClick={exportBackup}>
            <Download aria-hidden="true" />
            Export backup
          </button>
          <button type="button" className="button" onClick={() => inputRef.current?.click()}>
            <Upload aria-hidden="true" />
            Import backup
          </button>
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept="application/json,.json"
            aria-label="Import Lumen backup"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importBackup(file);
            }}
          />
        </div>
        <p className="data-card__hint">
          Spotify tokens and uploaded wallpaper files are not included in the backup.
        </p>
      </div>

      <div className="data-card">
        <div className="data-card__head">
          <span className="data-card__icon">
            <Database aria-hidden="true" />
          </span>
          <div>
            <strong>Local data</strong>
            <span>Clean up individual pieces without touching the rest of your setup.</span>
          </div>
        </div>
        <div className="data-list">
          <button
            type="button"
            className="data-list__row"
            onClick={() => {
              set('widgets.notes.text', '');
              toast('Quick notes cleared.');
              void readStats();
            }}
          >
            <span>
              <StickyNote aria-hidden="true" /> Quick notes
            </span>
            <small>{settings.widgets.notes.text.length} characters</small>
          </button>
          <button
            type="button"
            className="data-list__row"
            onClick={() => {
              void clearRecentSearches();
              toast('Search history cleared.');
              void readStats();
            }}
          >
            <span>
              <History aria-hidden="true" /> Search history
            </span>
            <small>Recent queries</small>
          </button>
        </div>
      </div>

      <div className="data-card">
        <div className="data-card__head">
          <span className="data-card__icon">
            <HardDrive aria-hidden="true" />
          </span>
          <div>
            <strong>Storage</strong>
            <span>{advanced ? 'Everything stays in Chrome local storage and IndexedDB.' : 'Settings, notes, and custom wallpapers live only in this browser.'}</span>
          </div>
        </div>
        {advanced ? (
          <div className="storage-meter">
            <div className="storage-meter__row">
              <span>Extension data</span>
              <strong>{formatBytes(localBytes)}</strong>
            </div>
            <div className="storage-meter__row">
              <span>Browser usage</span>
              <strong>{formatBytes(browserUsage)}</strong>
            </div>
            <div className="storage-meter__bar" aria-hidden="true">
              <span style={{ width: `${Math.max(2, usagePercent)}%` }} />
            </div>
            <div className="storage-meter__foot">
              <span>{quota ? `${formatBytes(quota)} available to this origin` : 'Quota unavailable'}</span>
              <span>{usagePercent.toFixed(1)}%</span>
            </div>
          </div>
        ) : (
          <button type="button" className="button button--small" onClick={toggleAdvanced}>
            <Lock aria-hidden="true" />
            Show storage details
          </button>
        )}
      </div>

      <div className="data-card data-card--danger">
        <div className="data-card__head">
          <span className="data-card__icon">
            <RotateCcw aria-hidden="true" />
          </span>
          <div>
            <strong>Reset everything</strong>
            <span>Restore the Aurora defaults. Shortcuts, notes, wallpaper choice, and widgets go back to factory.</span>
          </div>
        </div>
        <ConfirmButton
          className="button button--danger"
          confirmLabel="Click again to reset everything"
          onConfirm={() => {
            resetAll();
            toast('Lumen has been reset to its defaults.', 'success');
            void readStats();
          }}
        >
          Reset all settings
        </ConfirmButton>
      </div>

      <p className="settings-privacy-statement">
        No analytics, no telemetry, no remote code. Your wallpaper stays in IndexedDB; settings,
        notes, and search history stay in <code>chrome.storage.local</code>. You can delete them at
        any time from this panel.
      </p>
    </div>
  );
}
