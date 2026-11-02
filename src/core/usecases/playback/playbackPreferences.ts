export function mergePlaybackPreferences<T>(current: T, stored: unknown): T {
  if (!stored) {
    return current;
  }

  const source = stored as Record<string, unknown>;
  const target = current as Record<string, unknown>;
  for (const key in target) {
    if (Object.prototype.hasOwnProperty.call(target, key) && source[key] !== undefined) {
      target[key] = source[key];
    }
  }
  return current;
}
