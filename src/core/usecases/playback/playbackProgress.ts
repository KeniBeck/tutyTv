import { limitSeekPosition } from "./seekPosition";

export interface RelayPlaybackTotalInput {
  hasRelay: boolean;
  relayBase: number;
  probedDuration: number;
  videoDuration: number;
  episodeDuration: number;
  itemDuration: number;
  inferredDuration: number;
}

export function shouldPersistPlaybackHistory(
  position: number,
  itemId: unknown,
  now: number,
  lastSavedAt: number,
  force: boolean,
  minPosition: number = 3,
  intervalMs: number = 15e3
): boolean {
  if (!itemId || position < minPosition) return false;
  return Boolean(force || !(now - lastSavedAt < intervalMs));
}

export function resolvePlaybackTotalWithRelay(input: RelayPlaybackTotalInput): number {
  const video = Number(input.videoDuration) || 0;

  if (input.hasRelay) {
    if (input.probedDuration > 0) return input.probedDuration;
    const meta = input.episodeDuration || input.itemDuration || input.inferredDuration;
    if (meta) return meta;
    return isFinite(video) && video > 0 ? input.relayBase + video : 0;
  }

  let total = isFinite(video) && video > 0 ? video : 0;
  if (!total) total = input.episodeDuration;
  if (!total) total = input.itemDuration;
  if (!total) total = input.inferredDuration;
  return total || 0;
}

export function relaySeekTarget(
  relayBase: number,
  currentTime: number,
  pendingDelta: number,
  duration: number
): number {
  const target = Math.max(0, (Number(relayBase) || 0) + (Number(currentTime) || 0) + (Number(pendingDelta) || 0));
  return Math.floor(limitSeekPosition(target, Number(duration) || 0, true));
}

export function localSeekTarget(currentTime: number, pendingDelta: number, duration: number): number {
  return limitSeekPosition((Number(currentTime) || 0) + (Number(pendingDelta) || 0), Number(duration) || 0, false);
}
