import { isSeriesLike } from "../catalog/catalogNormalization";

function hasEntries(value: unknown): boolean {
  if (!value) return false;
  const length = (value as { length?: unknown }).length;
  return typeof length === "number" && length > 0;
}

export function shouldSaveHistoryBeforeReset(mode: unknown, hasVideo: unknown): boolean {
  return mode === "vod" && Boolean(hasVideo);
}

export function resolveAbortServiceBase(directBase: unknown, streamUrl: unknown): string {
  if (directBase) return String(directBase);
  if (!streamUrl || String(streamUrl).indexOf("127.0.0.1") === -1) return "";
  const match = /^(http:\/\/127\.0\.0\.1:\d+)/.exec(String(streamUrl));
  return match ? match[1] ?? "" : "";
}

export function shouldLoadSeriesEpisodesBeforePlay(item: unknown, episode: unknown): boolean {
  if (!item || typeof item !== "object") return false;
  const value = item as { episodes?: unknown; _detailsLoaded?: unknown };
  return isSeriesLike(item)
    && !episode
    && !hasEntries(value.episodes)
    && !value._detailsLoaded;
}

export function shouldReusePlaybackSession(
  screen: unknown,
  hasSource: unknown,
  sameItem: unknown,
  sameEpisode: unknown
): boolean {
  return screen === "detail" && Boolean(hasSource) && Boolean(sameItem) && Boolean(sameEpisode);
}

export function hasPlaybackSession(
  source: unknown,
  currentSource: unknown,
  streamUrl: unknown,
  streamError: unknown
): boolean {
  return !streamError && Boolean(source || currentSource || streamUrl);
}
