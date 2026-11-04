export interface AddonPresetLike {
  id?: string;
  name?: string;
  url?: string;
  count?: number;
}

export interface InitialAddonsResult<T> {
  addons: T[];
  persist: boolean;
}

export function selectInitialAddons<T>(stored: unknown, presets: ReadonlyArray<T>): InitialAddonsResult<T> {
  if (Array.isArray(stored) && stored.length) {
    return { addons: stored as T[], persist: false };
  }
  return { addons: presets.length ? [presets[0]!] : [], persist: true };
}

export function prepareAddonChannels<T extends object>(
  channels: ReadonlyArray<T>,
  isFavorite: (channel: T) => boolean
): Array<T & { index: number; fav: boolean }> {
  return channels.map((channel, index) => ({
    ...channel,
    index: index + 1,
    fav: isFavorite(channel)
  }));
}

export function clampLiveChannelIndex(index: number, length: number): number {
  let next = index;
  if (next < 0) next = 0;
  if (next > length - 1) next = length - 1;
  return next;
}
