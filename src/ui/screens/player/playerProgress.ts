import {
  formatPlaybackTime,
  playbackPercent,
  resolvePlaybackDuration
} from "../../../core/usecases/playback/duration";
import type { AppState } from "../../runtime/state";
import {
  getPlayerRelayBase,
  getPlayerRelayDuration,
  getPlayerRelayOffset
} from "./playerSource";

export interface PlayerProgressNode {
  textContent: string;
}

export interface PlayerProgressBar {
  style: {
    width: string;
    left?: string;
  };
}

export interface PlayerProgressVideo {
  duration?: number;
  buffered?: {
    length: number;
    end(index: number): number;
  };
}

export interface PlayerProgressHost {
  state: AppState;
  getVideo(): PlayerProgressVideo | null;
  getCurrentNode(): PlayerProgressNode | null;
  getTotalNode(): PlayerProgressNode | null;
  getProgressNode(): PlayerProgressBar | null;
  getBufferedNode(): PlayerProgressBar | null;
  getThumbNode(): PlayerProgressBar | null;
  getEpisodeDuration(): number;
  getItemDuration(): number;
  getInferredDuration(): number;
  getSubtitleEnd(): number;
  isSeries(): boolean;
  isScrubbing(): boolean;
  getScrubPosition(): number;
  hasPendingSeek(): boolean;
}

let host: PlayerProgressHost | null = null;

export function attachPlayerProgress(next: PlayerProgressHost): boolean {
  host = next;
  return true;
}

export function hasPlayerProgressRuntime(): boolean {
  return host !== null;
}

export function resetPlayerProgressRuntime(): void {
  host = null;
}

export function updatePlayerProgress(position: number, total: number): boolean {
  if (!host) {
    return false;
  }
  const current = host.getCurrentNode();
  const totalNode = host.getTotalNode();
  const progress = host.getProgressNode();
  if (!current || !totalNode || !progress) {
    return false;
  }

  const relayBase = getPlayerRelayBase();
  const relayOffset = getPlayerRelayOffset();
  const relayDuration = getPlayerRelayDuration();
  const value = Number(
    host.isScrubbing() && host.hasPendingSeek() ? host.getScrubPosition() : position
  ) || 0;
  const video = host.getVideo();
  const videoDuration = video && Number.isFinite(video.duration) && (video.duration || 0) > 0
    ? relayBase
      ? relayOffset + (video.duration || 0)
      : video.duration || 0
    : 0;
  const candidates = relayBase
    ? [
      relayDuration,
      host.getEpisodeDuration(),
      host.getItemDuration(),
      videoDuration,
      total,
      host.getInferredDuration(),
      host.getSubtitleEnd()
    ]
    : [
      total,
      host.getEpisodeDuration(),
      host.getItemDuration(),
      videoDuration,
      host.getInferredDuration(),
      host.getSubtitleEnd()
    ];
  const resolved = resolvePlaybackDuration(candidates, host.isSeries(), value);

  current.textContent = formatPlaybackTime(value);
  totalNode.textContent = formatPlaybackTime(resolved);
  const percent = playbackPercent(value, resolved);
  progress.style.width = `${percent.toFixed(2)}%`;
  const thumb = host.getThumbNode();
  if (thumb) {
    thumb.style.left = `${percent.toFixed(2)}%`;
  }

  const bufferedNode = host.getBufferedNode();
  if (video && video.buffered && video.buffered.length > 0) {
    try {
      let buffered = video.buffered.end(video.buffered.length - 1);
      if (relayBase) {
        buffered += relayOffset;
      }
      if (bufferedNode) {
        bufferedNode.style.width = `${playbackPercent(buffered, resolved).toFixed(2)}%`;
      }
    } catch {
      // Ignore buffered range read failures.
    }
  }
  return true;
}
