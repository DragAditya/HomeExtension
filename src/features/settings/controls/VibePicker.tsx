import { Check, Sparkles } from 'lucide-react';
import { VIBES, VIBE_IDS } from '../../../lib/vibes';
import { useSettings } from '../../../store/settings';

export function VibePicker() {
  const vibe = useSettings((state) => state.settings.appearance.vibe);
  const applyVibe = useSettings((state) => state.applyVibe);

  return (
    <div className="vibe-block">
      <div className="settings-block__head">
        <span className="settings-block__eyebrow">
          <Sparkles aria-hidden="true" /> Vibe
        </span>
        <span className="settings-block__aside">
          {vibe === 'custom' ? 'Custom blend' : 'One click, the whole mood'}
        </span>
      </div>
      <div className="vibe-picker" role="group" aria-label="Vibe">
        {VIBE_IDS.map((id) => {
          const entry = VIBES[id];
          const selected = vibe === id;
          return (
            <button
              key={id}
              type="button"
              className={`vibe-card ${selected ? 'vibe-card--active' : ''}`}
              aria-pressed={selected}
              onClick={() => applyVibe(id)}
            >
              <span className="vibe-card__preview" data-vibe={id} aria-hidden="true">
                <i />
                <b />
              </span>
              <span className="vibe-card__copy">
                <strong>{entry.label}</strong>
                <small>{entry.blurb}</small>
              </span>
              {selected && (
                <span className="vibe-card__check" aria-hidden="true">
                  <Check />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
