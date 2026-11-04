import type { AppState } from "../../runtime/state";
import {
  getPlayerRelayBase,
  getPlayerRelayOffset,
  setPlayerRelayOffset
} from "./playerSource";

export interface SeekVideo {
  currentTime?: number;
  duration?: number;
  [key: string]: unknown;
}

export interface PlayerSeekHost {
  state: AppState;
  getVideo(): SeekVideo | null;
  setSeekPreview(position: number): void;
  relaySeekTarget(
    relayBase: number,
    currentTime: number,
    pendingDelta: number,
    duration: unknown
  ): number;
  localSeekTarget(currentTime: number, pendingDelta: number, duration: number): number;
  seekVideo(video: SeekVideo, position: number): void;
  loadSource(url: string): void;
  seekCommitMs(): number;
  relaySeekResetMs(): number;
  setTransport(action: string): void;
}

let host: PlayerSeekHost | null = null;
let pendingSeek = 0;
let seekTimer: ReturnType<typeof setTimeout> | null = null;
let seekCommitted = false;
let seekResetTimer: ReturnType<typeof setTimeout> | null = null;

export function attachPlayerSeek(next: PlayerSeekHost): boolean {
  host = next;
  return true;
}

export function hasPlayerSeekRuntime(): boolean {
  return host !== null;
}

export function resetPlayerSeekRuntime(): void {
  host = null;
  resetPlayerSeekState();
}

export function hasPendingPlayerSeek(): boolean {
  return pendingSeek !== 0 || seekTimer !== null;
}

export function clearPlayerSeekReset(): void {
  seekCommitted = false;
  if (seekResetTimer) {
    clearTimeout(seekResetTimer);
    seekResetTimer = null;
  }
}

export function resetPlayerSeekState(): void {
  pendingSeek = 0;
  if (seekTimer) {
    clearTimeout(seekTimer);
    seekTimer = null;
  }
  clearPlayerSeekReset();
}

export function seekPlayerBy(delta: number): boolean {
  const video = host?.getVideo();
  if (!host || !video) {
    return false;
  }
  pendingSeek += delta;
  if (seekTimer) {
    clearTimeout(seekTimer);
  }
  seekTimer = setTimeout(commitPlayerSeek, host.seekCommitMs());
  host.setTransport(delta > 0 ? "forward" : "backward");
  setTimeout(function resetSeekIndicator() {
    host?.setTransport("none");
  }, 600);
  return true;
}

export function commitPlayerSeek(): boolean {
  if (seekTimer) {
    clearTimeout(seekTimer);
    seekTimer = null;
  }
  const video = host?.getVideo();
  if (!host || !video || !pendingSeek) {
    pendingSeek = 0;
    return false;
  }
  const relayBase = getPlayerRelayBase();
  if (relayBase) {
    if (seekCommitted) {
      pendingSeek = 0;
      return true;
    }
    seekCommitted = true;
    const item = host.state.playerItem as { duration?: unknown } | null;
    const duration = (item && item.duration) || video.duration || 0;
    const offset = host.relaySeekTarget(
      getPlayerRelayOffset(),
      video.currentTime || 0,
      pendingSeek,
      duration
    );
    pendingSeek = 0;
    setPlayerRelayOffset(offset);
    host.setSeekPreview(offset);
    const url = `${relayBase}?start=${offset}`;
    seekResetTimer = setTimeout(clearPlayerSeekReset, host.relaySeekResetMs());
    host.loadSource(url);
    return true;
  }
  const target = host.localSeekTarget(
    video.currentTime || 0,
    pendingSeek,
    video.duration || 0
  );
  pendingSeek = 0;
  host.setSeekPreview(target);
  try {
    host.seekVideo(video, target);
  } catch {
    // Ignore seek failures for local playback.
  }
  return true;
}
