export interface PlaybackStreamDescriptor {
  isHls: boolean;
  contentType: string;
}

export function currentPlaybackPosition(
  currentTime: unknown,
  relay: unknown,
  relayBase: unknown
): number {
  const current = Number(currentTime) || 0;
  return relay ? (Number(relayBase) || 0) + current : current;
}

export function resolvePlaybackTotal(
  videoDuration: unknown,
  episodeDuration: unknown,
  itemDuration: unknown
): number {
  const video = Number(videoDuration) || 0;
  if (isFinite(video) && video > 0) return video;
  const episode = Number(episodeDuration) || 0;
  if (episode) return episode;
  const item = Number(itemDuration) || 0;
  return item || 0;
}

export function describePlaybackStream(
  url: unknown,
  mime: unknown,
  itemIsHls: unknown
): PlaybackStreamDescriptor {
  const source = String(url || "");
  const streamMime = String(mime || "");
  const isHls = source.indexOf(".m3u8") !== -1
    || streamMime.indexOf("mpegurl") !== -1
    || Boolean(itemIsHls);
  const contentType = isHls
    ? "application/vnd.apple.mpegurl"
    : source.indexOf(".mp4") !== -1 || streamMime.indexOf("mp4") !== -1
      ? "video/mp4"
      : "video/mp2t";
  return { isHls, contentType };
}

export function shouldUseHls(
  isHls: unknown,
  nativeHls: unknown,
  nativeTv: unknown,
  hlsSupported: unknown
): boolean {
  return Boolean(isHls && !nativeHls && !nativeTv && hlsSupported);
}
