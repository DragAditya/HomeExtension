import { getWallpaper } from './idb';
import type { WallpaperSource } from './settings/types';

export type ResolvedWallpaper = {
  url: string;
  revoke: () => void;
};

export async function resolveWallpaperMedia(
  source: WallpaperSource,
): Promise<ResolvedWallpaper | null> {
  if (source.kind === 'scene') return null;
  if (source.id) {
    const blob = await getWallpaper(source.id);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    return { url, revoke: () => URL.revokeObjectURL(url) };
  }
  if (source.url) return { url: source.url, revoke: () => {} };
  return null;
}
