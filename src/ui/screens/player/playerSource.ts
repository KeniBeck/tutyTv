import { currentPlaybackPosition } from "../../../core/usecases/playback/playbackSession";
import { resolvePlaybackTotalWithRelay } from "../../../core/usecases/playback/playbackProgress";
import type { AppState } from "../../runtime/state";

export interface SourceVideo {
  currentTime?: number;
  duration?: number;
  error?: { code?: number } | null;
  preload?: string;
  mediaOption?: unknown;
  firstChild?: unknown;
  removeAttribute(name: string): void;
  removeChild(child: unknown): void;
  appendChild(child: unknown): void;
  play?(): Promise<void> | void;
  [key: string]: unknown;
}

export interface SourceHls {
  startLoad?(): void;
  recoverMediaError?(): void;
  [key: string]: unknown;
}

export interface SourceHlsData {
  fatal?: boolean;
  type?: string;
  [key: string]: unknown;
}

export interface SourceHlsEvents {
  [key: string]: unknown;
}

export interface SourceElement {
  setAttribute(name: string, value: string): void;
}

export interface SourceVideoHandlers {
  error(): void;
  loadeddata(): void;
  canplay(): void;
  loadedmetadata(): void;
  durationchange(): void;
  playing(): void;
  ended(): void;
  timeupdate(): void;
  pause(): void;
  play(): void;
  waiting(): void;
  stalled(): void;
  seeking(): void;
  seeked(): void;
  progress(): void;
}

export interface PlayerSourceHost {
  state: AppState;
  getVideo(): SourceVideo | null;
  resetStream(): void;
  notify(message: string): void;
  probeRelayDuration(base: string): void;
  getEpisodeDuration(): number;
  getItemDuration(): number;
  getInferredDuration(): number;
  seekVideo(video: SourceVideo, position: number): void;
  describeStream(url: string, mime: string, itemIsHls: unknown): {
    isHls: boolean;
    contentType: string;
  };
  wireVideoEvents(video: SourceVideo, handlers: SourceVideoHandlers): void;
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
  startHistoryTimer(tick: () => void): void;
  shouldTickHistory(): boolean;
  resolveTotal(video: SourceVideo): number;
  handleEnded(): void;
  selectNativeRetry(
    code: number | undefined,
    mode: string,
    streamMode: string,
    isHls: boolean,
    nativeHls: boolean,
    hasItem: boolean
  ): string | null;
  getLiveSequence(): number;
  scheduleRetry(guard: () => boolean, retry: () => void): void;
  getSmoothRetryMarker(): string;
  setSmoothRetryMarker(key: string): void;
  markCompatibleVod(item: unknown): void;
  reloadStream(): void;
  getMediaKey(item: unknown): string;
  applyPlaybackSurface(video: SourceVideo, active: boolean): void;
  nativeTvPlayback(): boolean;
  isHlsSupported(): boolean;
  shouldUseHls(
    isHls: boolean,
    nativeHls: boolean,
    nativeTv: boolean,
    hlsSupported: boolean
  ): boolean;
  destroyHls(): void;
  pause(video: SourceVideo): void;
  createHls(options: Record<string, unknown>): SourceHls;
  setActiveHls(hls: SourceHls): void;
  getHlsEvents(): SourceHlsEvents;
  wireHlsEvents(
    hls: SourceHls,
    events: SourceHlsEvents,
    onError: (event: unknown, data: SourceHlsData | null) => void,
    onManifest: () => void
  ): void;
  processHlsError(
    hls: SourceHls,
    data: SourceHlsData | null,
    onFatal: () => void
  ): void;
  loadHls(video: SourceVideo, hls: SourceHls, url: string): void;
  createSourceElement(): SourceElement;
  setVideoSource(video: SourceVideo, url: string): void;
  load(video: SourceVideo): void;
  play(video: SourceVideo): Promise<void> | void;
}

interface PlayerItem {
  isHls?: unknown;
  streamMime?: string;
  [key: string]: unknown;
}

let host: PlayerSourceHost | null = null;
let sourceUrl = "";
let relayOrigin = "";
let relayBase = "";
let relayOffset = 0;
let relayDuration = 0;

export function attachPlayerSource(next: PlayerSourceHost): boolean {
  host = next;
  return true;
}

export function hasPlayerSourceRuntime(): boolean {
  return host !== null;
}

export function resetPlayerSourceRuntime(): void {
  host = null;
  sourceUrl = "";
  relayOrigin = "";
  relayBase = "";
  relayOffset = 0;
  relayDuration = 0;
}

export function getPlayerSourceUrl(): string {
  return sourceUrl;
}

export function getPlayerRelayOrigin(): string {
  return relayOrigin;
}

export function getPlayerRelayBase(): string {
  return relayBase;
}

export function getPlayerRelayOffset(): number {
  return relayOffset;
}

export function getPlayerRelayDuration(): number {
  return relayDuration;
}

export function setPlayerRelayOffset(offset: number): void {
  relayOffset = offset;
}

export function setPlayerRelayDuration(duration: number): void {
  relayDuration = duration;
}

export function clearPlayerSourceUrls(): void {
  sourceUrl = "";
  relayOrigin = "";
}

export function resetPlayerRelayState(): void {
  relayBase = "";
  relayOffset = 0;
  relayDuration = 0;
}

export function getPlayerPosition(): number {
  const video = host?.getVideo();
  if (!host || !video) {
    return 0;
  }
  return currentPlaybackPosition(video.currentTime || 0, Boolean(relayBase), relayOffset);
}

export function getPlayerPlaybackTotal(): number {
  if (!host) {
    return 0;
  }
  const video = host.getVideo();
  const videoDuration = video && Number.isFinite(video.duration) && (video.duration || 0) > 0
    ? video.duration || 0
    : 0;
  return resolvePlaybackTotalWithRelay({
    hasRelay: Boolean(relayBase),
    relayBase: relayOffset,
    probedDuration: relayDuration,
    videoDuration,
    episodeDuration: host.getEpisodeDuration(),
    itemDuration: host.getItemDuration(),
    inferredDuration: host.getInferredDuration()
  });
}

export function loadPlayerSource(
  url?: string,
  options?: { nativeHls?: boolean }
): boolean {
  if (!host || !url) {
    return false;
  }
  const video = host.getVideo();
  if (!video) {
    return false;
  }

  const state = host.state;
  const nativeHls = Boolean(options && options.nativeHls);
  let resumeAt = Number(state.resumePosition) || 0;
  state.resumePosition = 0;
  const applyResume = (): void => {
    if (resumeAt > 0) {
      try {
        if (host) {
          host.seekVideo(video, resumeAt);
        }
      } catch {
        // Ignore seek failures while restoring resume position.
      }
      resumeAt = 0;
    }
  };

  state.noHistorySave = true;
  host.resetStream();
  state.noHistorySave = false;
  state.nextEpisodeDismissed = false;
  state.nextEpisodeGuardUntil = Date.now() + 2500;
  sourceUrl = url;

  const originMatch = /^(http:\/\/127\.0\.0\.1:\d+)/.exec(url);
  relayOrigin = originMatch ? originMatch[1] || "" : "";
  relayBase = "";
  relayOffset = 0;
  relayDuration = 0;
  if (/\/s\/[0-9a-f]+\.mp4/i.test(url)) {
    relayBase = url.split("?")[0] || "";
    const start = /[?&]start=(\d+)/.exec(url);
    relayOffset = start && start[1] ? parseInt(start[1], 10) : 0;
  }
  if (relayBase) {
    host.probeRelayDuration(relayBase);
  }

  host.notify("Conectando con el vídeo…");
  state.streamError = "";
  try {
    video.preload = "auto";
  } catch {
    // Ignore video preload failures.
  }

  const item = (state.playerItem || null) as PlayerItem | null;
  const descriptor = host.describeStream(
    url,
    item && item.streamMime ? item.streamMime : "",
    item ? item.isHls : undefined
  );
  const isHls = descriptor.isHls;
  const contentType = descriptor.contentType;

  const finishLoaded = (): void => {
    host?.clearBufferingNotice();
    host?.notify("");
  };

  const updateVodProgress = (): void => {
    if (!host || state.playerMode !== "vod") {
      return;
    }
    host.updateProgress(getPlayerPosition(), host.resolveTotal(video));
  };
  const updateRelayProgress = (): void => {
    if (!host || state.playerMode !== "vod") {
      return;
    }
    host.updateProgress(getPlayerPosition(), getPlayerPlaybackTotal());
  };

  host.wireVideoEvents(video, {
    error: function onError() {
      const active = host;
      if (!active) {
        return;
      }
      active.hideLoading();
      active.clearSeekReset();
      const code = video.error && typeof video.error.code === "number" ? video.error.code : undefined;
      const retry = active.selectNativeRetry(
        code,
        state.playerMode,
        state.streamMode,
        isHls,
        nativeHls,
        Boolean(state.playerItem)
      );
      if (retry === "native-hls") {
        const sequence = active.getLiveSequence();
        active.notify("Reintentando señal con compatibilidad webOS…");
        active.scheduleRetry(
          function canRetryNative() {
            return Boolean(host && state.playerMode === "live" && active.getLiveSequence() === sequence);
          },
          function retryNative() {
            loadPlayerSource(url, { nativeHls: true });
          }
        );
        return;
      }
      if (retry === "compatible-vod") {
        const retryItem = state.playerItem;
        const key = active.getMediaKey(retryItem);
        if (active.getSmoothRetryMarker() === key) {
          return finishError();
        }
        active.setSmoothRetryMarker(key);
        active.markCompatibleVod(retryItem);
        active.notify("Reintentando película en modo compatible…");
        active.scheduleRetry(
          function canRetryCompatible() {
            return Boolean(
              host
              && state.playerMode === "vod"
              && state.playerItem === retryItem
              && state.streamMode === "smooth"
            );
          },
          function retryCompatible() {
            host?.reloadStream();
          }
        );
        return;
      }
      finishError();

      function finishError(): void {
        const current = host;
        if (!current) {
          return;
        }
        state.streamError = `No se pudo abrir el stream (código ${code || "error"})`;
        current.applyPlaybackSurface(video as SourceVideo, false);
        current.notify(state.streamError);
      }
    },
    loadeddata: finishLoaded,
    canplay: function onCanPlay() {
      host?.clearSeekReset();
      finishLoaded();
    },
    loadedmetadata: function onLoadedMetadata() {
      finishLoaded();
      if (state.playerMode === "vod" && host) {
        host.updateProgress(getPlayerPosition(), host.resolveTotal(video));
      }
      applyResume();
    },
    durationchange: updateVodProgress,
    playing: function onPlaying() {
      host?.hideLoading();
      finishLoaded();
    },
    ended: function onEnded() {
      if (state.playerMode === "vod") {
        host?.handleEnded();
      }
    },
    timeupdate: function onTimeUpdate() {
      const active = host;
      if (!active) {
        return;
      }
      if ((video.currentTime || 0) > 0) {
        finishLoaded();
      }
      if (state.playerMode !== "vod") {
        return;
      }
      const position = getPlayerPosition();
      const total = active.resolveTotal(video);
      active.updateProgress(position, total);
      active.updateHistory(position);
      active.saveHistory(position, total);
      active.maybeShowNextEpisodePrompt(position, getPlayerPlaybackTotal());
    },
    pause: function onPause() {
      const active = host;
      if (!active) {
        return;
      }
      active.stopHistoryTimer();
      if (state.playerMode === "vod") {
        active.saveHistory(getPlayerPosition(), active.resolveTotal(video), true);
        active.setTransport("pause");
      }
    },
    play: function onPlay() {
      const active = host;
      if (!active || state.playerMode !== "vod") {
        return;
      }
      active.setTransport("none");
      active.stopHistoryTimer();
      active.startHistoryTimer(function historyTick() {
        const current = host;
        if (!current || !current.shouldTickHistory()) {
          return;
        }
        const position = getPlayerPosition();
        const total = current.resolveTotal(video);
        current.updateProgress(position, total);
        current.updateHistory(position);
        current.saveHistory(position, total);
      });
    },
    waiting: function onWaiting() {
      host?.scheduleBufferingNotice("Cargando vídeo…");
      updateRelayProgress();
    },
    stalled: function onStalled() {
      host?.scheduleBufferingNotice("Conectando…");
      updateRelayProgress();
    },
    seeking: updateRelayProgress,
    seeked: updateRelayProgress,
    progress: updateRelayProgress
  });

  const useHls = host.shouldUseHls(
    isHls,
    nativeHls,
    host.nativeTvPlayback(),
    host.isHlsSupported()
  );
  if (useHls) {
    host.destroyHls();
    try {
      host.pause(video);
    } catch {
      // Ignore pause failures before HLS setup.
    }
    try {
      video.removeAttribute("src");
    } catch {
      // Ignore source cleanup failures before HLS setup.
    }
    try {
      host.setVideoSource(video, "");
    } catch {
      // Ignore source cleanup failures before HLS setup.
    }
    while (video.firstChild) {
      video.removeChild(video.firstChild);
    }
    try {
      video.mediaOption = null;
    } catch {
      // Ignore media option cleanup failures before HLS setup.
    }

    const hls = host.createHls({ enableWorker: true, backBufferLength: 30 });
    host.setActiveHls(hls);
    host.wireHlsEvents(
      hls,
      host.getHlsEvents(),
      function onHlsError(_event, data) {
        host?.processHlsError(hls, data, function onFatal() {
          if (!host) {
            return;
          }
          state.streamError = "No se pudo abrir el stream (HLS)";
          host.notify(state.streamError);
        });
      },
      function onManifestParsed() {
        try {
          const playback = host?.play(video);
          if (playback && typeof playback.catch === "function") {
            playback.catch(function ignorePlayFailure() {});
          }
        } catch {
          // Ignore play failures until media is ready.
        }
        applyResume();
      }
    );
    host.loadHls(video, hls, url);
    host.applyPlaybackSurface(video, true);
    try {
      const playback = host.play(video);
      if (playback && typeof playback.catch === "function") {
        playback.catch(function ignorePlayFailure() {});
      }
    } catch {
      // Ignore play failures until media is ready.
    }
    return true;
  }

  while (video.firstChild) {
    video.removeChild(video.firstChild);
  }
  try {
    video.removeAttribute("src");
  } catch {
    // Ignore source cleanup failures before native setup.
  }

  if (isHls) {
    const mediaOption = {
      mediaTransportType: "HLS",
      option: {
        transmission: {
          playTime: {
            start: 0
          }
        }
      }
    };
    const encodedOption = encodeURI(JSON.stringify(mediaOption));
    const sourceType = nativeHls ? contentType : `${contentType};mediaOption=${encodedOption}`;
    if (nativeHls) {
      try {
        video.mediaOption = null;
      } catch {
        // Ignore media option cleanup failures for native HLS.
      }
    } else {
      try {
        video.mediaOption = mediaOption;
      } catch {
        // Ignore media option assignment failures.
      }
    }
    const source = host.createSourceElement();
    source.setAttribute("src", url);
    source.setAttribute("type", sourceType);
    video.appendChild(source);
  } else {
    try {
      video.mediaOption = null;
    } catch {
      // Ignore media option cleanup failures.
    }
    try {
      host.setVideoSource(video, url);
    } catch {
      // Ignore source assignment failures.
    }
  }

  try {
    host.seekVideo(video, 0);
  } catch {
    // Ignore initial seek failures.
  }
  host.applyPlaybackSurface(video, true);
  try {
    if (isHls) {
      host.load(video);
    }
    const playback = host.play(video);
    if (playback && typeof playback.catch === "function") {
      playback.catch(function onPlayFailed() {
        if (host && !video.error) {
          state.streamError = "Pulsa OK para iniciar la reproducción";
          host.notify(state.streamError);
        }
      });
    }
  } catch {
    state.streamError = "Pulsa OK para iniciar la reproducción";
    host.notify(state.streamError);
  }
  return true;
}
