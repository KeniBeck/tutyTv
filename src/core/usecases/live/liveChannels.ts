import { normalizeText } from "../../text/normalizeText";

export interface LiveChannelLike {
  name?: unknown;
}

export interface LiveCategoryLike {
  name?: unknown;
}

export interface IndexedLiveChannel<T> {
  channel: T;
  index: number;
}

export interface LiveSearchResult<T, C> {
  channels: Array<IndexedLiveChannel<T>>;
  categories: C[];
}

export function filterLiveChannels<T>(
  channels: ReadonlyArray<T>,
  favoritesOnly: boolean,
  isFavorite: (channel: T) => boolean
): Array<IndexedLiveChannel<T>> {
  const result: Array<IndexedLiveChannel<T>> = [];

  for (let index = 0; index < channels.length; index++) {
    const channel = channels[index]!;
    if (!favoritesOnly || isFavorite(channel)) {
      result.push({ channel, index });
    }
  }

  return result;
}

export function findLiveSearchMatches<T extends LiveChannelLike, C extends LiveCategoryLike>(
  channels: ReadonlyArray<T>,
  categories: ReadonlyArray<C>,
  query: unknown,
  limits: { channels?: number; categories?: number } = {}
): LiveSearchResult<T, C> {
  const needle = normalizeText(query);
  const channelLimit = limits.channels ?? 250;
  const categoryLimit = limits.categories ?? 8;
  const channelMatches: Array<IndexedLiveChannel<T>> = [];
  const categoryMatches: C[] = [];

  if (needle) {
    for (const category of categories) {
      if (categoryMatches.length >= categoryLimit) break;
      if (normalizeText(category.name).indexOf(needle) !== -1) {
        categoryMatches.push(category);
      }
    }
  }

  for (let index = 0; index < channels.length; index++) {
    if (channelMatches.length >= channelLimit) break;
    const channel = channels[index];
    if (channel && (!needle || normalizeText(channel.name).indexOf(needle) !== -1)) {
      channelMatches.push({ channel, index });
    }
  }

  return { channels: channelMatches, categories: categoryMatches };
}
