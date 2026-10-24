import { Check, Image, Loader2, Trash2, Upload, Video } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { deleteWallpaper, estimateStorage, putWallpaper } from '../../../lib/idb';
import { resolveWallpaperMedia, type ResolvedWallpaper } from '../../../lib/wallpaper';
import { SCENES } from '../../../lib/vibes';
import { useSettings } from '../../../store/settings';
import { useUI } from '../../../store/ui';

const STORAGE_HEADROOM = 8 * 1024 * 1024;

export function WallpaperPicker() {
  const wallpaper = useSettings((state) => state.settings.appearance.wallpaper);
  const set = useSettings((state) => state.set);
  const toast = useUI((state) => state.toast);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<ResolvedWallpaper | null>(null);

  const custom = wallpaper.kind !== 'scene' ? wallpaper : null;

  useEffect(() => {
    let active = true;
    let resolved: ResolvedWallpaper | null = null;
    setPreview(null);
    if (!custom) return;
    void resolveWallpaperMedia(custom).then((result) => {
      if (!active) {
        result?.revoke();
        return;
      }
      resolved = result;
      setPreview(result);
    });
    return () => {
      active = false;
      resolved?.revoke();
    };
  }, [custom]);

  const chooseScene = (scene: (typeof SCENES)[number]['id']) => {
    set('appearance.wallpaper', { kind: 'scene', scene });
  };

  const acceptFile = async (file: File) => {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast('Choose an image or video file.', 'error');
      return;
    }
    if (file.size <= 0) {
      toast('That file is empty.', 'error');
      return;
    }
    setUploading(true);
    let savedId: string | null = null;
    try {
      const estimate = await estimateStorage();
      if (estimate && estimate.quota > 0) {
        const available = Math.max(0, estimate.quota - estimate.usage);
        if (file.size + STORAGE_HEADROOM > available) {
          toast('There is not enough browser storage for that file. Free some space first.', 'error');
          return;
        }
      }
      try {
        await navigator.storage?.persist?.();
      } catch {
        // Persistence is a bonus; the upload can continue without it.
      }

      const id = `wallpaper-${crypto.randomUUID()}`;
      savedId = id;
      await putWallpaper(id, file);
      const oldId = custom?.id;
      set('appearance.wallpaper', {
        kind: file.type.startsWith('video/') ? 'video' : 'image',
        url: '',
        id,
      });
      if (oldId && oldId !== id) void deleteWallpaper(oldId);
      toast('Wallpaper updated.', 'success');
    } catch (error) {
      if (savedId) void deleteWallpaper(savedId);
      const quotaError =
        (error instanceof DOMException &&
          (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) ||
        (error instanceof Error && error.name === 'QuotaExceededError');
      toast(
        quotaError
          ? 'There is not enough browser storage for that file. Free some space first.'
          : 'That wallpaper could not be saved.',
        'error',
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeCustom = async () => {
    const id = custom?.id;
    set('appearance.wallpaper', { kind: 'scene', scene: 'deep-field' });
    if (id) {
      try {
        await deleteWallpaper(id);
      } catch {
        // The preset is already restored; cleanup is best-effort.
      }
    }
    toast('Custom wallpaper removed.');
  };

  return (
    <div className="settings-block">
      <div className="settings-block__head">
        <span className="settings-block__eyebrow">
          <Image aria-hidden="true" /> Wallpaper
        </span>
        <span className="settings-block__aside">Six scenes, or make it yours</span>
      </div>

      <div className="wallpaper-grid" role="group" aria-label="Scene wallpapers">
        {SCENES.map((scene) => {
          const selected = wallpaper.kind === 'scene' && wallpaper.scene === scene.id;
          return (
            <button
              key={scene.id}
              type="button"
              className={`wallpaper-tile ${selected ? 'wallpaper-tile--active' : ''}`}
              aria-pressed={selected}
              onClick={() => chooseScene(scene.id)}
            >
              <span className="wallpaper-tile__preview" data-scene-preview={scene.id} aria-hidden="true">
                <i />
              </span>
              <span className="wallpaper-tile__label">{scene.label}</span>
              {selected && (
                <span className="wallpaper-tile__check" aria-hidden="true">
                  <Check />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        className={`wallpaper-custom ${custom ? 'wallpaper-custom--active' : ''}`}
        aria-busy={uploading}
      >
        <div className="wallpaper-custom__preview">
          {preview ? (
            custom?.kind === 'video' ? (
              <video src={preview.url} muted loop autoPlay playsInline preload="metadata" />
            ) : (
              <img src={preview.url} alt="" />
            )
          ) : custom ? (
            <Video aria-hidden="true" />
          ) : (
            <Upload aria-hidden="true" />
          )}
        </div>
        <div className="wallpaper-custom__copy">
          <strong>{custom ? 'Your wallpaper' : 'Use your own'}</strong>
          <span>
            {custom
              ? 'Image or video, saved only in this browser.'
              : 'A still or a loop. Stored locally, with no added size cap.'}
          </span>
        </div>
        <div className="wallpaper-custom__actions">
          <button
            type="button"
            className="button button--small"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 aria-hidden="true" className="spin" /> : <Upload aria-hidden="true" />}
            {custom ? 'Replace' : 'Upload'}
          </button>
          {custom && (
            <button
              type="button"
              className="button button--small button--danger"
              aria-label="Remove custom wallpaper"
              title="Remove custom wallpaper"
              onClick={() => void removeCustom()}
            >
              <Trash2 aria-hidden="true" />
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/*,video/*"
          aria-label="Upload wallpaper"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void acceptFile(file);
          }}
        />
      </div>
    </div>
  );
}
