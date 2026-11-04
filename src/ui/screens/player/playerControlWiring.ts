import { inferEpisodeDuration, parsePlaybackDuration } from "../../../core/usecases/playback/duration";
import { localSeekTarget, relaySeekTarget } from "../../../core/usecases/playback/playbackProgress";
import { isSeriesLike } from "../../../core/usecases/catalog/catalogNormalization";
import { PLAYBACK_TIMING } from "../../../core/usecases/playback/playbackTiming";
import { relayDurationEndpoint } from "../../../core/usecases/playback/relayDuration";
import type { AppState } from "../../runtime/state";
import {
  attachPlayerProgress,
  type PlayerProgressBar,
  type PlayerProgressNode,
  type PlayerProgressVideo
} from "./playerProgress";
import {
  attachPlayerRelayProbe
} from "./playerRelayProbe";
import {
  attachPlayerSeek,
  hasPendingPlayerSeek,
  type SeekVideo
} from "./playerSeek";
import {
  attachPlayerTransport,
  getPlayerScrubPosition,
  isPlayerScrubbing,
  setPlayerScrubPosition,
  type TransportVideo
} from "./playerTransport";

export interface PlayerControlWiringDeps {
  state: AppState;
  getVideo(): TransportVideo | SeekVideo | PlayerProgressVideo | null;
  getSeekbar(): { classList: { toggle(name: string, force?: boolean): void } } | null;
  getCurrentNode(): PlayerProgressNode | null;
  getTotalNode(): PlayerProgressNode | null;
  getProgressNode(): PlayerProgressBar | null;
  getBufferedNode(): PlayerProgressBar | null;
  getThumbNode(): PlayerProgressBar | null;
  getSubtitleEnd(): number;
  clearInfobarTimer(): void;
  playVideo(video: TransportVideo): Promise<void> | void;
  pauseVideo(video: TransportVideo): void;
  setTransport(action: string): void;
  showInfobar(): void;
  scheduleInfobarHide(): void;
  focus(node: unknown): void;
  focusPlayer(): void;
  seekVideo(video: SeekVideo, position: number): void;
  loadSource(url: string): void;
  updateProgress(position: number, total: number): void;
}

export function attachPlayerControlWiring(deps: PlayerControlWiringDeps): boolean {
  attachPlayerTransport({
    state: deps.state,
    getVideo: () => deps.getVideo() as TransportVideo | null,
    hasSeekbar: () => Boolean(deps.getSeekbar()),
    playVideo: deps.playVideo,
    pauseVideo: deps.pauseVideo,
    setTransport: deps.setTransport,
    showInfobar: deps.showInfobar,
    scheduleInfobarHide: deps.scheduleInfobarHide,
    clearInfobarTimer: deps.clearInfobarTimer,
    setScrubbing: function setScrubbing(active) {
      deps.getSeekbar()?.classList.toggle("is-scrubbing", active);
    },
    focusSeekbar: function focusSeekbar() {
      deps.focus(deps.getSeekbar());
    },
    focusPlayer: deps.focusPlayer
  });
  attachPlayerSeek({
    state: deps.state,
    getVideo: () => deps.getVideo() as SeekVideo | null,
    setSeekPreview: setPlayerScrubPosition,
    relaySeekTarget,
    localSeekTarget,
    seekVideo: deps.seekVideo,
    loadSource: deps.loadSource,
    seekCommitMs: () => PLAYBACK_TIMING.seekCommitMs,
    relaySeekResetMs: () => PLAYBACK_TIMING.relaySeekResetMs,
    setTransport: deps.setTransport
  });
  attachPlayerProgress({
    state: deps.state,
    getVideo: () => deps.getVideo() as PlayerProgressVideo | null,
    getCurrentNode: deps.getCurrentNode,
    getTotalNode: deps.getTotalNode,
    getProgressNode: deps.getProgressNode,
    getBufferedNode: deps.getBufferedNode,
    getThumbNode: deps.getThumbNode,
    getEpisodeDuration: function getEpisodeDuration() {
      return parseDuration(deps.state.playerEpisode);
    },
    getItemDuration: function getItemDuration() {
      return parseDuration(deps.state.playerItem);
    },
    getInferredDuration: function getInferredDuration() {
      const item = deps.state.playerItem as { episodes?: unknown[] } | null;
      return inferEpisodeDuration(item && item.episodes ? item.episodes : [], deps.state.playerEpisode);
    },
    getSubtitleEnd: deps.getSubtitleEnd,
    isSeries: function isSeries() {
      return isSeriesLike(deps.state.playerItem);
    },
    isScrubbing: isPlayerScrubbing,
    getScrubPosition: getPlayerScrubPosition,
    hasPendingSeek: hasPendingPlayerSeek
  });
  attachPlayerRelayProbe({
    state: deps.state,
    updateProgress: deps.updateProgress,
    relayDurationEndpoint: function endpoint(url) {
      return relayDurationEndpoint(url) || "";
    }
  });
  return true;
}

function parseDuration(item: unknown): number {
  if (!item || typeof item !== "object") {
    return 0;
  }
  return parsePlaybackDuration((item as { duration?: unknown }).duration);
}
