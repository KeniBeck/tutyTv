export interface PreviewChannel {
  channelCode?: string;
  streamUrl?: string;
  name?: string;
  [key: string]: unknown;
}

export interface PreviewResponse {
  returnValue?: boolean;
  proxyPath?: string;
  url?: string;
  isHls?: boolean;
}

export interface PreviewVideo {
  src: string;
  onloadeddata: (() => void) | null;
  onerror: (() => void) | null;
  pause(): void;
  removeAttribute(name: string): void;
}

export interface PreviewContainer {
  classList: {
    add(...names: string[]): void;
    remove(...names: string[]): void;
    contains(name: string): boolean;
  };
}

export interface PreviewStatus {
  textContent: string | null;
}

export interface PreviewHls {
  on(event: string, callback: (event?: unknown, data?: { fatal?: boolean }) => void): void;
  destroy(): void;
}

export interface PreviewHlsEvents {
  MANIFEST_PARSED: string;
  ERROR: string;
}

export interface PreviewHost {
  isHomeLive(): boolean;
  getChannel(): PreviewChannel | null;
  getVideo(): PreviewVideo | null;
  getContainer(): PreviewContainer | null;
  getStatus(): PreviewStatus | null;
  resolveLive(
    channel: PreviewChannel,
    done: (error: string | null | undefined, response: PreviewResponse | null | undefined) => void
  ): void;
  play(video: PreviewVideo): Promise<void> | void;
  pause(video: PreviewVideo): void;
  setSource(video: PreviewVideo, url: string): void;
  load(video: PreviewVideo): void;
  loadHls(video: PreviewVideo, hls: PreviewHls, url: string): void;
  destroyHls(): void;
  setHls(hls: PreviewHls): void;
  createHls(): PreviewHls;
  hlsEvents(): PreviewHlsEvents | null;
  canUseHls(): boolean;
  nativeTvPlayback(): boolean;
  nativePreviewHls(video: PreviewVideo): boolean;
}

let host: PreviewHost | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let activeSource = "";
let sequence = 0;

export function attachPreview(next: PreviewHost): boolean {
  host = next;
  return true;
}

export function hasPreviewRuntime(): boolean {
  return host !== null;
}

export function stopPreview(): boolean {
  if (!host) {
    return false;
  }
  sequence += 1;
  activeSource = "";
  clearTimer();
  clearPreviewState(host);
  const video = host.getVideo();
  if (video) {
    host.destroyHls();
    try {
      host.pause(video);
    } catch {
      // El preview se limpia aunque el pause falle.
    }
    video.removeAttribute("src");
    try {
      host.setSource(video, "");
      host.load(video);
    } catch {
      // La fuente ya quedó vacía.
    }
  }
  return true;
}

export function previewChannel(channel?: PreviewChannel | null): boolean {
  if (!host) {
    return false;
  }
  clearTimer();
  timer = setTimeout(() => {
    timer = null;
    startPreview(channel || host?.getChannel() || null);
  }, 220);
  return true;
}

export function resetPreviewRuntime(): void {
  if (host) {
    stopPreview();
  }
  host = null;
  timer = null;
  activeSource = "";
  sequence = 0;
}

function clearTimer(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

function clearPreviewState(runtime: PreviewHost): void {
  const container = runtime.getContainer();
  container?.classList.remove("is-preview-playing", "is-preview-loading");
  const status = runtime.getStatus();
  if (status) {
    status.textContent = "";
  }
}

function startPreview(channel: PreviewChannel | null): void {
  const runtime = host;
  if (!runtime || !channel || (!channel.channelCode && !channel.streamUrl) || !runtime.isHomeLive()) {
    return;
  }
  const source = String(channel.channelCode || channel.streamUrl);
  const container = runtime.getContainer();
  if (
    source === activeSource &&
    container &&
    (container.classList.contains("is-preview-loading") || container.classList.contains("is-preview-playing"))
  ) {
    return;
  }

  stopPreview();
  activeSource = source;
  const requestId = sequence;
  container?.classList.add("is-preview-loading");
  const status = runtime.getStatus();
  if (status) {
    status.textContent = `Cargando ${channel.name || "canal"}…`;
  }

  runtime.resolveLive(channel, (error, response) => {
    if (requestId !== sequence || !runtime.isHomeLive()) {
      return;
    }
    const isResolved = !error && response && response.returnValue !== false;
    const url = isResolved ? response.proxyPath || response.url || "" : "";
    if (!url) {
      clearPreviewState(runtime);
      return;
    }
    const video = runtime.getVideo();
    if (!video) {
      clearPreviewState(runtime);
      return;
    }

    video.onloadeddata = function onLoadedData() {
      if (requestId !== sequence) {
        return;
      }
      container?.classList.remove("is-preview-loading");
      container?.classList.add("is-preview-playing");
      if (status) {
        status.textContent = "";
      }
    };
    video.onerror = function onError() {
      if (requestId === sequence) {
        clearPreviewState(runtime);
      }
    };

    const isHls = Boolean(response && response.isHls) || /\.m3u8(?:\?|$)/i.test(url);
    const events = runtime.hlsEvents();
    const useHls = Boolean(
      isHls &&
        events &&
        runtime.canUseHls() &&
        !runtime.nativeTvPlayback() &&
        !runtime.nativePreviewHls(video)
    );
    if (useHls && events) {
      runtime.destroyHls();
      const hls = runtime.createHls();
      runtime.setHls(hls);
      hls.on(events.MANIFEST_PARSED, () => {
        if (requestId !== sequence) {
          return;
        }
        try {
          const playback = runtime.play(video);
          playback?.catch?.(() => clearLoading(runtime));
        } catch {
          clearLoading(runtime);
        }
      });
      hls.on(events.ERROR, (_event, data) => {
        if (data?.fatal && requestId === sequence) {
          clearPreviewState(runtime);
        }
      });
      try {
        runtime.loadHls(video, hls, url);
      } catch {
        clearPreviewState(runtime);
      }
      return;
    }

    try {
      runtime.setSource(video, url);
      runtime.load(video);
      const playback = runtime.play(video);
      playback?.catch?.(() => clearLoading(runtime));
    } catch {
      clearLoading(runtime);
    }
  });
}

function clearLoading(runtime: PreviewHost): void {
  runtime.getContainer()?.classList.remove("is-preview-loading");
}
