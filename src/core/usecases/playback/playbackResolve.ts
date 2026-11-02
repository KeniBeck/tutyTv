import { applyRelayResumeStart, shouldForceRelay } from "./streamMode";

export interface ResolveEpisode {
  id?: unknown;
  duration?: unknown;
  number?: unknown;
}

export interface ResolveItem {
  id?: unknown;
  seasonId?: unknown;
  duration?: unknown;
  episodes?: ReadonlyArray<ResolveEpisode>;
}

export interface ResolveRequestOptions {
  streamMode: string;
  resumePosition: unknown;
  trackIndex: unknown;
  audioTrack: unknown;
  isSeries: boolean;
}

export interface ResolveRequestResult {
  request: Record<string, unknown>;
  episode: ResolveEpisode | null | undefined;
  resumePosition: number;
  missingEpisodes: boolean;
}

export interface ResolveResponse {
  mime?: unknown;
  codec?: unknown;
  duration?: unknown;
  subtitles?: unknown;
  audio?: unknown;
  isHls?: unknown;
  proxyPath?: unknown;
  url?: unknown;
  selectedTrack?: unknown;
  availableTracks?: unknown;
}

export interface ResolvedPlayback {
  url: string;
  resumePosition: number;
  streamInfo: {
    selectedTrack: unknown;
    availableTracks: unknown;
  };
}

export function buildPlaybackResolveRequest(
  item: ResolveItem,
  episode: ResolveEpisode | null | undefined,
  options: ResolveRequestOptions
): ResolveRequestResult {
  const resumeAt = Number(options.resumePosition) || 0;
  const request: Record<string, unknown> = {
    contentId: item.id,
    playbackMode: options.streamMode,
    forceRelay: shouldForceRelay(options.streamMode, resumeAt),
    trackIndex: options.trackIndex || 0,
    audioTrack: options.audioTrack || 0
  };
  let nextEpisode = episode;

  if (options.isSeries) {
    const seasonId = item.seasonId || item.id;
    if (nextEpisode && nextEpisode.id) {
      request.contentId = nextEpisode.id;
      request.seriesContentId = seasonId;
    } else {
      if (!item.episodes || !item.episodes.length) {
        return { request, episode: nextEpisode, resumePosition: resumeAt, missingEpisodes: true };
      }
      nextEpisode = item.episodes[0];
      request.contentId = nextEpisode?.id;
      request.seriesContentId = seasonId;
    }
  }

  return { request, episode: nextEpisode, resumePosition: resumeAt, missingEpisodes: false };
}

export function applyResolvedPlayback(
  item: ResolveItem,
  episode: ResolveEpisode | null | undefined,
  response: ResolveResponse,
  resumeAt: unknown
): ResolvedPlayback {
  const target = item as Record<string, unknown>;
  const duration = Number(response.duration) || 0;

  target.streamMime = response.mime || "";
  target.streamCodec = response.codec || "";
  if (duration > 0) {
    target.duration = duration;
    if (episode) (episode as Record<string, unknown>).duration = duration;
  } else {
    target.duration = target.duration || 0;
  }
  target.subtitles = response.subtitles || [];
  target.streamAudioInfo = response.audio || "";
  target.isHls = Boolean(response.isHls);

  const relayResume = applyRelayResumeStart(
    String(response.proxyPath || response.url || ""),
    Number(resumeAt) || 0
  );

  return {
    url: relayResume.url,
    resumePosition: relayResume.consumed ? 0 : Number(resumeAt) || 0,
    streamInfo: {
      selectedTrack: response.selectedTrack || {},
      availableTracks: response.availableTracks || []
    }
  };
}
