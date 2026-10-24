import { useEffect, useRef, useState } from 'react';
import { resolveWallpaperMedia, type ResolvedWallpaper } from '../../lib/wallpaper';
import { useSettings } from '../../store/settings';
import { useUI } from '../../store/ui';

export function WallpaperLayer() {
  const wallpaper = useSettings((state) => state.settings.appearance.wallpaper);
  const parallax = useSettings(
    (state) =>
      state.settings.appearance.effects.parallax &&
      state.settings.appearance.motion === 'full' &&
      state.settings.appearance.wallpaper.kind !== 'video',
  );
  const toast = useUI((state) => state.toast);
  const [media, setMedia] = useState<ResolvedWallpaper | null>(null);
  const [failed, setFailed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const failureToast = useRef(false);

  useEffect(() => {
    let active = true;
    let resolved: ResolvedWallpaper | null = null;
    setMedia(null);
    setFailed(false);
    setVideoReady(false);
    failureToast.current = false;
    if (wallpaper.kind === 'scene') return;

    void resolveWallpaperMedia(wallpaper)
      .then((result) => {
        if (!active) {
          result?.revoke();
          return;
        }
        if (!result) {
          setFailed(true);
          if (!failureToast.current) {
            failureToast.current = true;
            toast('That wallpaper could not be found. Showing the preset scene.', 'error');
          }
          return;
        }
        resolved = result;
        setMedia(result);
      })
      .catch(() => {
        if (!active) return;
        setFailed(true);
        if (!failureToast.current) {
          failureToast.current = true;
          toast('That wallpaper could not be loaded. Showing the preset scene.', 'error');
        }
      });

    return () => {
      active = false;
      resolved?.revoke();
    };
  }, [toast, wallpaper]);

  useEffect(() => {
    if (!media || wallpaper.kind !== 'video') return;
    const video = videoRef.current;
    if (!video) return;
    if (document.visibilityState === 'hidden') video.pause();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        video.pause();
      } else {
        void video.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [media, wallpaper.kind]);

  useEffect(() => {
    const root = document.documentElement;
    if (!parallax) {
      root.style.setProperty('--pointer-x', '0');
      root.style.setProperty('--pointer-y', '0');
      return;
    }
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const x = (event.clientX / window.innerWidth - 0.5) * 2;
        const y = (event.clientY / window.innerHeight - 0.5) * 2;
        root.style.setProperty('--pointer-x', x.toFixed(3));
        root.style.setProperty('--pointer-y', y.toFixed(3));
      });
    };
    const onLeave = () => {
      root.style.setProperty('--pointer-x', '0');
      root.style.setProperty('--pointer-y', '0');
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('blur', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('blur', onLeave);
      if (frame) window.cancelAnimationFrame(frame);
      onLeave();
    };
  }, [parallax]);

  const fail = () => {
    setFailed(true);
    if (!failureToast.current) {
      failureToast.current = true;
      toast('That wallpaper could not be loaded. Showing the preset scene.', 'error');
    }
  };

  const kind = failed || !media ? 'scene' : wallpaper.kind;
  const mediaReady = wallpaper.kind !== 'video' || videoReady || failed;

  return (
    <div
      className="wallpaper"
      data-kind={kind}
      data-media-ready={mediaReady ? 'true' : 'false'}
      aria-hidden="true"
    >
      <div className="wallpaper__parallax">
        <div className="wallpaper__scene" />
        {media && wallpaper.kind === 'image' && (
          <img
            key={media.url}
            className="wallpaper__media"
            src={media.url}
            alt=""
            draggable={false}
            decoding="async"
            onError={fail}
          />
        )}
        {media && wallpaper.kind === 'video' && (
          <video
            key={media.url}
            ref={videoRef}
            className="wallpaper__media"
            src={media.url}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            tabIndex={-1}
            onCanPlay={() => setVideoReady(true)}
            onLoadedData={() => setVideoReady(true)}
            onPlaying={() => setVideoReady(true)}
            onError={fail}
          />
        )}
      </div>
      <div className="wallpaper__dim" />
      <div className="wallpaper__vignette" />
      <div className="wallpaper__grain" />
    </div>
  );
}
