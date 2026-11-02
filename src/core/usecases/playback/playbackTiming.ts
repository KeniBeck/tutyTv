export const PLAYBACK_TIMING = {
  bufferNoticeMs: 700,
  seekCommitMs: 800,
  liveResolveMs: 180,
  historyTickMs: 500,
  relaySeekResetMs: 12000
} as const;

export function shouldReportBuffering(
  streamError: unknown,
  hasVideo: unknown,
  paused: unknown,
  readyState: unknown
): boolean {
  return !streamError
    && Boolean(hasVideo)
    && !paused
    && (Number(readyState) || 0) < 3;
}

export function shouldTickPlayback(
  screen: unknown,
  mode: unknown,
  hasVideo: unknown,
  paused: unknown
): boolean {
  return screen === "player" && mode === "vod" && Boolean(hasVideo) && !paused;
}

export function resolveLiveResolveDelay(immediate: unknown): number {
  return immediate ? 0 : PLAYBACK_TIMING.liveResolveMs;
}
