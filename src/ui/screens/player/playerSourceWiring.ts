import {
  describePlaybackStream,
  resolvePlaybackTotal,
  shouldUseHls
} from "../../../core/usecases/playback/playbackSession";
import {
  inferEpisodeDuration,
  parsePlaybackDuration
} from "../../../core/usecases/playback/duration";
import {
  handleHlsError
} from "../../../platforms/shared/hlsRecovery";
import {
  scheduleGuardedRetry
} from "../../../platforms/shared/playbackCoordinator";
import {
  PLAYBACK_TIMING as playbackTiming,
  shouldTickPlayback
} from "../../../core/usecases/playback/playbackTiming";
import {
  wireHlsPlaybackEvents,
  wirePlaybackVideoEvents
} from "../../../core/usecases/playback/playbackEventWiring";
import { selectNativeRetry } from "../../../core/usecases/playback/nativeRetry";
import type { AppState } from "../../runtime/state";
import {
  attachPlayerSource,
  type PlayerSourceHost,
  type SourceElement,
  type SourceHls,
  type SourceHlsEvents,
  type SourceVideo,
} from "./playerSource";

export interface PlayerSourceWiringDeps {
  state: AppState;
  getVideo(): SourceVideo | null;
  resetStream(): void;
  notify(message: string): void;
  probeRelayDuration(base: string): void;
  seekVideo(video: SourceVideo, position: number): void;
  clearBufferingNotice(): void;
  clearSeekReset(): void;
  hideLoading(): void;
  scheduleBufferingNotice(message: string): void;
  updateProgress(position: number, total: number): void;
  updateHistory(position: number): void;
  saveHistory(position: number, total: number, force?: boolean): void;
  maybeShowNextEpisodePrompt(position: number, total: number): void;
  setTransport(action: string): void;
  stopHistoryTimer(): void;
  handleEnded(): void;
  getLiveSequence(): number;
  getSmoothRetryMarker(): string;
  setSmoothRetryMarker(key: string): void;
  markCompatibleVod(item: unknown): void;
  reloadStream(): void;
  applyPlaybackSurface(video: SourceVideo, active: boolean): void;
  nativeTvPlayback(): boolean;
  isHlsSupported(): boolean;
  destroyHls(): void;
  pause(video: SourceVideo): void;
  createHls(options: Record<string, unknown>): SourceHls;
  setActiveHls(hls: SourceHls): void;
  getHlsEvents(): SourceHlsEvents;
  getHlsErrorTypes(): unknown;
  loadHls(video: SourceVideo, hls: SourceHls, url: string): void;
  createSourceElement(): SourceElement;
  setVideoSource(video: SourceVideo, url: string): void;
  load(video: SourceVideo): void;
  play(video: SourceVideo): Promise<void> | void;
  getSourceMediaKey(item: unknown): string;
}

let currentDeps: PlayerSourceWiringDeps | null = null;

export function attachPlayerSourceWiring(deps: PlayerSourceWiringDeps): boolean {
  currentDeps = deps;
  const host: PlayerSourceHost = {
    state: deps.state,
    getVideo: deps.getVideo,
    resetStream: deps.resetStream,
    notify: deps.notify,
    probeRelayDuration: deps.probeRelayDuration,
    getEpisodeDuration,
    getItemDuration,
    getInferredDuration,
    seekVideo: deps.seekVideo,
    describeStream: function describeStream(url, mime, itemIsHls) {
      return describePlaybackStream(url, mime, itemIsHls);
    },
    wireVideoEvents: function wireVideoEvents(video, handlers) {
      wirePlaybackVideoEvents(video, handlers);
    },
    clearBufferingNotice: deps.clearBufferingNotice,
    clearSeekReset: deps.clearSeekReset,
    hideLoading: deps.hideLoading,
    scheduleBufferingNotice: deps.scheduleBufferingNotice,
    updateProgress: deps.updateProgress,
    updateHistory: deps.updateHistory,
    saveHistory: deps.saveHistory,
    maybeShowNextEpisodePrompt: deps.maybeShowNextEpisodePrompt,
    setTransport: deps.setTransport,
    stopHistoryTimer: deps.stopHistoryTimer,
    startHistoryTimer: function startHistoryTimer(tick) {
      deps.stopHistoryTimer();
      setInterval(tick, playbackTiming.historyTickMs);
    },
    shouldTickHistory: function shouldTickHistory() {
      const video = deps.getVideo();
      return shouldTickPlayback(
        deps.state.screen,
        deps.state.playerMode,
        Boolean(video),
        video ? Boolean(video.paused) : true
      );
    },
    resolveTotal: function resolveTotal(video) {
      return resolvePlaybackTotal(
        video.duration,
        getEpisodeDuration(),
        getItemDuration()
      );
    },
    handleEnded: deps.handleEnded,
    selectNativeRetry,
    getLiveSequence: deps.getLiveSequence,
    scheduleRetry: function scheduleRetry(guard, retry) {
      scheduleGuardedRetry(function schedule(callback) {
        setTimeout(callback, 0);
      }, guard, retry);
    },
    getSmoothRetryMarker: deps.getSmoothRetryMarker,
    setSmoothRetryMarker: deps.setSmoothRetryMarker,
    markCompatibleVod: deps.markCompatibleVod,
    reloadStream: deps.reloadStream,
    getMediaKey: deps.getSourceMediaKey,
    applyPlaybackSurface: deps.applyPlaybackSurface,
    nativeTvPlayback: deps.nativeTvPlayback,
    isHlsSupported: deps.isHlsSupported,
    shouldUseHls,
    destroyHls: deps.destroyHls,
    pause: deps.pause,
    createHls: deps.createHls,
    setActiveHls: deps.setActiveHls,
    getHlsEvents: deps.getHlsEvents,
    wireHlsEvents: function wireHlsEvents(hls, events, onError, onManifest) {
      wireHlsPlaybackEvents(hls as never, events as never, onError as never, onManifest as never);
    },
    processHlsError: function processHlsError(hls, data, onFatal) {
      handleHlsError(hls as never, data, function errorTypes() {
        return deps.getHlsErrorTypes() as never;
      }, onFatal);
    },
    loadHls: deps.loadHls,
    createSourceElement: deps.createSourceElement,
    setVideoSource: deps.setVideoSource,
    load: deps.load,
    play: deps.play
  };
  return attachPlayerSource(host);
}

export function resetPlayerSourceWiring(): void {
  currentDeps = null;
}

function getEpisodeDuration(): number {
  return parseDuration(currentDeps ? currentDeps.state.playerEpisode : null);
}

function getItemDuration(): number {
  return parseDuration(currentDeps ? currentDeps.state.playerItem : null);
}

function getInferredDuration(): number {
  if (!currentDeps) {
    return 0;
  }
  const item = currentDeps.state.playerItem as { episodes?: unknown[] } | null;
  return inferEpisodeDuration(item && item.episodes ? item.episodes : [], currentDeps.state.playerEpisode);
}

function parseDuration(item: unknown): number {
  if (!item || typeof item !== "object") {
    return 0;
  }
  return parsePlaybackDuration((item as { duration?: unknown }).duration);
}
