import type { AppState } from "../../runtime/state";
import { updatePlayerProgress } from "./playerProgress";
import { hasPendingPlayerSeek, seekPlayerBy } from "./playerSeek";
import { getPlayerPlaybackTotal, getPlayerPosition } from "./playerSource";

export interface TransportVideo {
  paused?: boolean;
  [key: string]: unknown;
}

export interface PlayerTransportHost {
  state: AppState;
  getVideo(): TransportVideo | null;
  hasSeekbar(): boolean;
  playVideo(video: TransportVideo): Promise<void> | void;
  pauseVideo(video: TransportVideo): void;
  setTransport(action: string): void;
  showInfobar(): void;
  scheduleInfobarHide(): void;
  clearInfobarTimer(): void;
  setScrubbing(active: boolean): void;
  focusSeekbar(): void;
  focusPlayer(): void;
}

let host: PlayerTransportHost | null = null;
let scrubbing = false;
let scrubPosition = 0;

export function attachPlayerTransport(next: PlayerTransportHost): boolean {
  host = next;
  return true;
}

export function hasPlayerTransportRuntime(): boolean {
  return host !== null;
}

export function resetPlayerTransportRuntime(): void {
  host = null;
  scrubbing = false;
  scrubPosition = 0;
}

export function isPlayerScrubbing(): boolean {
  return scrubbing;
}

export function getPlayerScrubPosition(): number {
  return scrubPosition;
}

export function setPlayerScrubPosition(position: number): void {
  scrubPosition = Number(position) || 0;
}

export function startPlayerScrub(): boolean {
  const total = getPlayerPlaybackTotal();
  if (!host || !host.hasSeekbar() || !total) {
    host?.showInfobar();
    return false;
  }
  scrubPosition = Math.max(0, Math.min(total - 1, getPlayerPosition()));
  scrubbing = true;
  host.setScrubbing(true);
  host.showInfobar();
  host.clearInfobarTimer();
  updatePlayerProgress(scrubPosition, total);
  host.focusSeekbar();
  return true;
}

export function stepPlayerScrub(direction: number): boolean {
  const total = getPlayerPlaybackTotal();
  if (!host || !scrubbing || !total) {
    return false;
  }
  const base = hasPendingPlayerSeek() ? scrubPosition : getPlayerPosition();
  scrubPosition = Math.max(0, Math.min(total - 1, base + 10 * direction));
  updatePlayerProgress(scrubPosition, total);
  seekPlayerBy(10 * direction);
  return true;
}

export function endPlayerScrub(): boolean {
  if (!host || !scrubbing) {
    return false;
  }
  scrubbing = false;
  host.setScrubbing(false);
  updatePlayerProgress(
    hasPendingPlayerSeek() ? scrubPosition : getPlayerPosition(),
    getPlayerPlaybackTotal()
  );
  host.focusPlayer();
  host.scheduleInfobarHide();
  return true;
}

export function togglePlayerPlayback(): boolean {
  const video = host?.getVideo();
  if (!host || !video) {
    return false;
  }
  if (video.paused) {
    try {
      const playback = host.playVideo(video);
      if (playback && typeof playback.catch === "function") {
        playback.catch(function ignorePlayFailure() {});
      }
    } catch {
      // Ignore play failures from the remote.
    }
    host.setTransport("none");
  } else {
    try {
      host.pauseVideo(video);
    } catch {
      // Ignore pause failures from the remote.
    }
    host.setTransport("pause");
  }
  host.showInfobar();
  return true;
}
