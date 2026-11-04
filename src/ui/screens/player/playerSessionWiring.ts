import { resolveAbortServiceBase, shouldSaveHistoryBeforeReset } from "../../../core/usecases/playback/playbackLifecycle";
import { parsePlaybackDuration } from "../../../core/usecases/playback/duration";
import { resolvePlaybackTotal } from "../../../core/usecases/playback/playbackSession";
import type { AppState } from "../../runtime/state";
import { attachPlayerEpisodeSwitch, type SwitchEpisode, type SwitchItem } from "./episodeSwitch";
import { attachPlayerCleanup, type PlayerCleanupHost } from "./playerCleanup";
import {
  getPlayerRelayOrigin,
  getPlayerSourceUrl
} from "./playerSource";
import {
  attachPlayerTracks,
  type MediaInfo,
  type TrackEpisode,
  type TrackItem,
  type PlayerTracksHost
} from "./playerTracks";

export interface PlayerSessionWiringDeps {
  state: AppState;
  getVideo(): { duration?: number } | null;
  getPosition(): number;
  getAudioIndex(): number;
  getMediaKey(item: TrackItem): string;
  getEpisode(item: TrackItem): TrackEpisode | null;
  requestMediaInfo(
    params: Record<string, unknown>,
    done: (error: unknown, response: MediaInfo | null) => void
  ): void;
  loadSubtitle(track: unknown): void;
  resetStream(): void;
  closeNextEpisodePrompt(restoreFocus: boolean): void;
  refreshPlayerChannels(): void;
  renderDetailEpisodes(item: SwitchItem): void;
  notify(message: string): void;
  startPlayback(item: SwitchItem, episode: SwitchEpisode): void;
  saveHistory(position: number, total: number, force?: boolean): void;
  resetPlaybackState(): void;
  abortMedia(base: string): void;
  destroyHls(): void;
  clearVideo(video: unknown): void;
  clearSessionSource(): void;
  resolveTarget(item: unknown, done: (error: unknown, response: unknown) => void): void;
  loadSource(url: string): void;
  seekVideoPosition(position: number): void;
}

export function attachPlayerSessionWiring(deps: PlayerSessionWiringDeps): boolean {
  attachPlayerEpisodeSwitch({
    state: deps.state,
    resetStream: deps.resetStream,
    closeNextEpisodePrompt: deps.closeNextEpisodePrompt,
    refreshPlayerChannels: deps.refreshPlayerChannels,
    renderDetailEpisodes: deps.renderDetailEpisodes,
    notify: deps.notify,
    startPlayback: deps.startPlayback
  });
  attachPlayerTracks({
    state: deps.state,
    getMediaKey: deps.getMediaKey,
    getEpisode: deps.getEpisode,
    requestMediaInfo: deps.requestMediaInfo,
    loadSubtitle: deps.loadSubtitle as PlayerTracksHost["loadSubtitle"]
  });
  const cleanup: PlayerCleanupHost = {
    state: deps.state,
    getVideo: () => deps.getVideo() as never,
    getPosition: deps.getPosition,
    getAudioIndex: deps.getAudioIndex,
    closeNextEpisodePrompt: deps.closeNextEpisodePrompt,
    shouldSaveHistoryBeforeReset: function shouldSave() {
      return shouldSaveHistoryBeforeReset(deps.state.playerMode, Boolean(deps.getVideo()));
    },
    saveHistoryBeforeReset: function saveBeforeReset() {
      const video = deps.getVideo();
      deps.saveHistory(
        deps.getPosition(),
        resolvePlaybackTotal(
          video ? video.duration : 0,
          parseDuration(deps.state.playerEpisode),
          parseDuration(deps.state.playerItem)
        ),
        true
      );
    },
    resetPlaybackState: deps.resetPlaybackState,
    resolveAbortBase: function resolveBase() {
      return resolveAbortServiceBase(getPlayerRelayOrigin(), getPlayerSourceUrl());
    },
    abortMedia: deps.abortMedia,
    destroyHls: deps.destroyHls,
    clearVideo: deps.clearVideo as never,
    clearSessionSource: deps.clearSessionSource,
    notify: deps.notify,
    resolveTarget: deps.resolveTarget as never,
    loadSource: deps.loadSource,
    seekVideo: deps.seekVideoPosition
  };
  attachPlayerCleanup(cleanup);
  return true;
}

function parseDuration(item: unknown): number {
  if (!item || typeof item !== "object") {
    return 0;
  }
  return parsePlaybackDuration((item as { duration?: unknown }).duration);
}
