import {
  chooseSubtitleTrack,
  normalizeSubtitleTracks,
  selectAudioTrackIndex,
  type SubtitleTrack as CoreSubtitleTrack
} from "../../../core/usecases/playback/mediaTracks";
import type { AppState } from "../../runtime/state";

export type PlayerSubtitleTrack = CoreSubtitleTrack;

export interface MediaInfo {
  audio?: string;
  subtitles?: PlayerSubtitleTrack[];
  returnValue?: boolean;
  [key: string]: unknown;
}

export interface TrackItem {
  id?: string | number;
  seasonId?: string | number;
  episodes?: TrackEpisode[];
  [key: string]: unknown;
}

export interface TrackEpisode {
  id?: string | number;
  [key: string]: unknown;
}

export interface PlayerTracksHost {
  state: AppState;
  getMediaKey(item: TrackItem): string;
  getEpisode(item: TrackItem): TrackEpisode | null;
  requestMediaInfo(
    params: Record<string, unknown>,
    done: (error: unknown, response: MediaInfo | null) => void
  ): void;
  loadSubtitle(track: PlayerSubtitleTrack | null): void;
}

type MediaInfoCallback = (media: MediaInfo | null) => void;

let host: PlayerTracksHost | null = null;
let mediaInfoCache: Record<string, MediaInfo> = {};
let mediaInfoPending: Record<string, MediaInfoCallback[]> = {};
let currentSubtitle: PlayerSubtitleTrack | null = null;
let subtitleEnabled = false;
let subtitleForced = false;

export function attachPlayerTracks(next: PlayerTracksHost): boolean {
  host = next;
  return true;
}

export function hasPlayerTracksRuntime(): boolean {
  return host !== null;
}

export function resetPlayerTracksRuntime(): void {
  host = null;
  mediaInfoCache = {};
  mediaInfoPending = {};
  currentSubtitle = null;
  subtitleEnabled = false;
  subtitleForced = false;
}

export function getPlayerMediaInfo(key: string): MediaInfo | null {
  return mediaInfoCache[key] || null;
}

export function getPlayerMediaKey(item: TrackItem | null): string {
  return host && item ? host.getMediaKey(item) : "";
}

export function loadPlayerMediaInfo(
  item: TrackItem | null,
  done?: MediaInfoCallback
): boolean {
  const finish = done || function ignoreMediaInfo() {};
  if (!host || !item) {
    finish(null);
    return false;
  }
  const key = host.getMediaKey(item);
  if (!key) {
    finish(null);
    return false;
  }
  const cached = mediaInfoCache[key];
  if (cached) {
    applyPlayerSubtitleTracks(cached);
    finish(cached);
    return true;
  }
  const pending = mediaInfoPending[key];
  if (pending) {
    pending.push(finish);
    return true;
  }
  mediaInfoPending[key] = [finish];
  const episode = host.getEpisode(item);
  const seasonId = item.seasonId || item.id;
  const params: Record<string, unknown> = { contentId: key };
  if (episode && episode.id && seasonId && episode.id !== seasonId) {
    params.seriesContentId = seasonId;
  }
  host.requestMediaInfo(params, function onMediaInfo(error, response) {
    if (!host) {
      return;
    }
    const callbacks = mediaInfoPending[key] || [];
    delete mediaInfoPending[key];
    const media = !error && response && response.returnValue !== false ? response : null;
    if (media) {
      mediaInfoCache[key] = media;
      applyPlayerSubtitleTracks(media);
    }
    for (const callback of callbacks) {
      try {
        callback(media);
      } catch {
        // Ignore media info callback failures from screens.
      }
    }
  });
  return true;
}

export function getPlayerSubtitleTracks(media?: MediaInfo | null): PlayerSubtitleTrack[] {
  return normalizeSubtitleTracks(media || null);
}

export function selectPlayerAudioIndex(audio: string | undefined): number {
  if (!host) {
    return 0;
  }
  return selectAudioTrackIndex(
    audio,
    host.state.playback.audioCode,
    host.state.playback.audio
  );
}

export function applyPlayerSubtitleTracks(media: MediaInfo | null): boolean {
  if (!host) {
    return false;
  }
  const tracks = getPlayerSubtitleTracks(media);
  if (subtitleForced) {
    if (!subtitleEnabled) {
      return true;
    }
    if (!tracks.length) {
      subtitleEnabled = false;
      currentSubtitle = null;
      host.loadSubtitle(null);
      return true;
    }
    let found = false;
    if (currentSubtitle) {
      for (const track of tracks) {
        if (track.url === currentSubtitle.url) {
          currentSubtitle = track;
          found = true;
          break;
        }
      }
    }
    if (!found) {
      currentSubtitle = tracks[0] || null;
      host.loadSubtitle(currentSubtitle);
    }
    return true;
  }
  if (!host.state.playback.subtitle || !tracks.length) {
    subtitleEnabled = false;
    currentSubtitle = null;
    host.loadSubtitle(null);
    return true;
  }
  subtitleEnabled = true;
  currentSubtitle = chooseSubtitleTrack(
    tracks,
    host.state.playback.subCode,
    host.state.playback.subLang
  );
  host.loadSubtitle(currentSubtitle);
  return true;
}

export function applyPlayerSubtitlePreference(): boolean {
  if (!subtitleForced) {
    subtitleEnabled = host ? Boolean(host.state.playback.subtitle) : false;
  }
  return subtitleEnabled;
}

export function isPlayerSubtitleEnabled(): boolean {
  return subtitleEnabled;
}

export function setPlayerSubtitleEnabled(value: boolean): void {
  subtitleEnabled = Boolean(value);
}

export function getCurrentPlayerSubtitle(): PlayerSubtitleTrack | null {
  return currentSubtitle;
}

export function setCurrentPlayerSubtitle(track: PlayerSubtitleTrack | null): void {
  currentSubtitle = track;
}

export function setPlayerSubtitleForced(value: boolean): void {
  subtitleForced = Boolean(value);
}

export function resetPlayerTrackSelection(): void {
  currentSubtitle = null;
  subtitleEnabled = false;
  subtitleForced = false;
  if (host) {
    host.state.trackIndex = 0;
  }
}
