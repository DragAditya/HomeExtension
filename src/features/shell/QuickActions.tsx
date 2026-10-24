import { Settings2 } from 'lucide-react';
import { useUI } from '../../store/ui';

export function QuickActions() {
  const openSettings = useUI((state) => state.openSettings);

  return (
    <div className="quick-actions">
      <button
        type="button"
        className="quick-actions__button"
        aria-label="Open settings"
        title="Settings (Alt ,)"
        onClick={() => openSettings()}
      >
        <Settings2 aria-hidden="true" />
      </button>
    </div>
  );
}
