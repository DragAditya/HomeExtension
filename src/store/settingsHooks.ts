import { getValue } from '../lib/settings/paths';
import { useSettings } from './settings';

export function useSetting<T>(path: string) {
  const value = useSettings((state) => getValue(state.settings, path) as T);
  const set = useSettings((state) => state.set);
  return [value, (next: T) => set(path, next)] as const;
}
