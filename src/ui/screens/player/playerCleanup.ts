import type { AppState } from "../../runtime/state";

export interface CleanupVideo {
  currentTime?: number;
  duration?: number;
  [key: string]: unknown;
}

export interface PlayerCleanupHost {
  state: AppState;
  getVideo(): CleanupVideo | null;
  getPosition(): number;
  getAudioIndex(): number;
  closeNextEpisodePrompt(restoreFocus: boolean): void;
  shouldSaveHistoryBeforeReset(): boolean;
  saveHistoryBeforeReset(): void;
  resetPlaybackState(): void;
  resolveAbortBase(): string;
  abortMedia(base: string): void;
  destroyHls(): void;
  clearVideo(video: CleanupVideo): void;
  clearSessionSource(): void;
  notify(message: string): void;
  resolveTarget(item: unknown, done: (target: string | null) => void): void;
  loadSource(url: string): void;
  seekVideo(position: number): void;
}

let host: PlayerCleanupHost | null = null;

export function attachPlayerCleanup(next: PlayerCleanupHost): boolean {
  host = next;
  return true;
}

export function resetPlayerCleanupRuntime(): void {
  host = null;
}

export function reloadPlayerStream(): boolean {
  if (!host || !host.getVideo()) {
    return false;
  }
  const position = host.getPosition();
  const item = host.state.playerItem;
  resetPlayerStream();
  host.notify("Cambiando reproductor…");
  host.resolveTarget(item, function applyTarget(target) {
    if (!host) {
      return;
    }
    if (!target) {
      if (!host.state.streamError) {
        host.notify("Sin fuente de reproducción");
      }
      return;
    }
    if (/\/s\/[0-9a-f]+\.mp4/i.test(target)) {
      let url = `${target}?start=${Math.floor(position)}`;
      const audio = host.getAudioIndex();
      if (audio) {
        url += `&a=${audio}`;
      }
      host.loadSource(url);
      return;
    }
    host.loadSource(target);
    if (position > 0) {
      try {
        host.seekVideo(position);
      } catch {
        // Ignore seek failures during reload.
      }
    }
  });
  return true;
}

export function resetPlayerStream(): boolean {
  if (!host) {
    return false;
  }
  if (host.state.nextEpisodeOpen) {
    host.closeNextEpisodePrompt(false);
  }
  const video = host.getVideo();
  if (video && host.shouldSaveHistoryBeforeReset()) {
    host.saveHistoryBeforeReset();
  }
  host.resetPlaybackState();
  host.abortMedia(host.resolveAbortBase());
  host.destroyHls();
  if (video) {
    host.clearVideo(video);
  }
  host.clearSessionSource();
  return true;
}
