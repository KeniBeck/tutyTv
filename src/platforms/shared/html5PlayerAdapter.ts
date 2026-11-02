import type { PlayerAdapter, PlayerSource } from "../../core/contracts/player-adapter";

export interface VideoElementLike {
  src: string;
  currentTime: number;
  play(): Promise<void> | void;
  pause(): void;
  load?(): void;
}

export interface HlsInstanceLike {
  destroy?(): void;
}

export interface HlsLoaderLike extends HlsInstanceLike {
  attachMedia(video: VideoElementLike): void;
  loadSource(url: string): void;
}

export interface Html5PlayerOptions {
  video: VideoElementLike;
  createHls?: () => HlsLoaderLike;
  canPlayNativeHls?: () => boolean;
}

export interface Html5PlayerAdapterHandle extends PlayerAdapter {
  playImmediate(): Promise<void> | void;
  setSource(url: string): void;
  reload(): void;
  loadExternalHls(hls: HlsLoaderLike, url: string): void;
}

export function createHtml5PlayerAdapter(options: Html5PlayerOptions): Html5PlayerAdapterHandle {
  const { video, createHls, canPlayNativeHls } = options;
  let hls: HlsLoaderLike | null = null;

  const destroyHls = (): void => {
    if (hls) {
      hls.destroy?.();
      hls = null;
    }
  };

  return {
    playImmediate(): Promise<void> | void {
      return video.play();
    },
    setSource(url: string): void {
      video.src = url;
    },
    reload(): void {
      video.load!();
    },
    loadExternalHls(loader: HlsLoaderLike, url: string): void {
      loader.loadSource(url);
      loader.attachMedia(video);
    },
    async load(source: PlayerSource): Promise<void> {
      destroyHls();
      const nativeHls = canPlayNativeHls ? canPlayNativeHls() : false;

      if (source.isHls && !nativeHls && createHls) {
        hls = createHls();
        hls.attachMedia(video);
        hls.loadSource(source.url);
        return;
      }

      video.src = source.url;
      video.load?.();
    },
    async play(): Promise<void> {
      await video.play();
    },
    pause(): void {
      video.pause();
    },
    stop(): void {
      video.pause();
      video.currentTime = 0;
      destroyHls();
      video.src = "";
    },
    seekTo(seconds: number): void {
      video.currentTime = seconds;
    }
  };
}
