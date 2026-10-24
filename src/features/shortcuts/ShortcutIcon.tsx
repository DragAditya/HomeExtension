import { useEffect, useMemo, useRef, useState } from 'react';
import { faviconCandidates, iconCacheKey, monogram } from '../../lib/favicon';
import { cacheIcon, getCachedIcon, removeCachedIcon } from '../../lib/iconCache';

type ShortcutIconProps = {
  name: string;
  url: string;
  icon?: string;
};

function isRemote(src: string | undefined): boolean {
  return Boolean(src && /^https?:\/\//i.test(src));
}

export function ShortcutIcon({ name, url, icon }: ShortcutIconProps) {
  const cacheKey = useMemo(() => iconCacheKey(url, icon), [icon, url]);
  const candidates = useMemo(() => faviconCandidates(url, icon), [icon, url]);
  const [attempt, setAttempt] = useState(0);
  const [cached, setCached] = useState<string | null>(() => getCachedIcon(cacheKey));
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [offline, setOffline] = useState(
    () => typeof navigator !== 'undefined' && navigator.onLine === false,
  );
  const imageRef = useRef<HTMLImageElement>(null);
  const mountedKey = useRef(cacheKey);
  const src = cached ?? candidates[attempt];

  useEffect(() => {
    if (mountedKey.current === cacheKey) return;
    mountedKey.current = cacheKey;
    setAttempt(0);
    setCached(getCachedIcon(cacheKey));
    setLoaded(false);
    setFailed(false);
  }, [cacheKey]);

  useEffect(() => {
    if (!loaded && !failed) {
      const image = imageRef.current;
      if (image?.complete && image.naturalWidth > 0) {
        setLoaded(true);
        if (!cached && isRemote(src)) void cacheIcon(cacheKey, src);
      }
    }
  }, [cacheKey, cached, failed, loaded, src]);

  useEffect(() => {
    const online = () => {
      setOffline(false);
      setAttempt(0);
      setFailed(false);
      setLoaded(false);
    };
    const offlineHandler = () => setOffline(true);
    window.addEventListener('online', online);
    window.addEventListener('offline', offlineHandler);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offlineHandler);
    };
  }, []);

  const blockedByOffline = offline && !cached && isRemote(src);

  const handleError = () => {
    setLoaded(false);
    if (cached) {
      removeCachedIcon(cacheKey);
      setCached(null);
      setAttempt(0);
      return;
    }
    if (attempt + 1 < candidates.length) {
      setAttempt(attempt + 1);
      return;
    }
    setFailed(true);
  };

  return (
    <span className="shortcut-icon" aria-hidden="true">
      {!loaded && <span className="shortcut-monogram">{monogram(name)}</span>}
      {src && !failed && !blockedByOffline && (
        <img
          key={src}
          ref={imageRef}
          className={`shortcut-icon__img ${loaded ? 'shortcut-icon__img--ready' : ''}`}
          src={src}
          alt=""
          width={25}
          height={25}
          loading="eager"
          decoding="async"
          draggable={false}
          referrerPolicy="no-referrer"
          onLoad={() => {
            setLoaded(true);
            if (!cached && isRemote(src)) void cacheIcon(cacheKey, src);
          }}
          onError={handleError}
        />
      )}
    </span>
  );
}
