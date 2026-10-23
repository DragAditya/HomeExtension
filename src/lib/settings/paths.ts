export function getValue(source: unknown, path: string): unknown {
  if (!path) return source;
  return path.split('.').reduce<unknown>((value, key) => {
    if (value && typeof value === 'object') {
      return (value as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
}

export function setValue<T>(source: T, path: string, value: unknown): T {
  if (!path) return value as T;
  const keys = path.split('.');
  const root: Record<string, unknown> = Array.isArray(source)
    ? ([...source] as unknown as Record<string, unknown>)
    : ({ ...(source as Record<string, unknown>) } as Record<string, unknown>);
  let cursor: Record<string, unknown> = root;
  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index];
    const current = cursor[key];
    const next: Record<string, unknown> = Array.isArray(current)
      ? ([...current] as unknown as Record<string, unknown>)
      : current && typeof current === 'object'
        ? { ...(current as Record<string, unknown>) }
        : {};
    cursor[key] = next;
    cursor = next;
  }
  cursor[keys[keys.length - 1]] = value;
  return root as T;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
