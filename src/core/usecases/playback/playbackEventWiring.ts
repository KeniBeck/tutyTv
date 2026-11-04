export const PLAYBACK_VIDEO_EVENTS = [
  "error",
  "loadeddata",
  "canplay",
  "loadedmetadata",
  "durationchange",
  "playing",
  "ended",
  "timeupdate",
  "pause",
  "play",
  "waiting",
  "stalled",
  "seeking",
  "seeked",
  "progress"
] as const;

export type PlaybackVideoEvent = typeof PLAYBACK_VIDEO_EVENTS[number];

export type PlaybackVideoHandlers = Record<PlaybackVideoEvent, unknown>;

export interface HlsEventSource {
  on(event: string, handler: (...args: unknown[]) => void): unknown;
}

export interface HlsEventNames {
  ERROR: string;
  MANIFEST_PARSED: string;
}

export function wirePlaybackVideoEvents(
  target: Record<string, unknown>,
  handlers: PlaybackVideoHandlers
): void {
  for (const event of PLAYBACK_VIDEO_EVENTS) {
    target["on" + event] = handlers[event];
  }
}

export function wireHlsPlaybackEvents(
  hls: HlsEventSource,
  events: HlsEventNames,
  onError: (...args: unknown[]) => void,
  onManifestParsed: (...args: unknown[]) => void
): void {
  hls.on(events.ERROR, onError);
  hls.on(events.MANIFEST_PARSED, onManifestParsed);
}
