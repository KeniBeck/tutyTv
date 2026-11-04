export function limitSeekPosition(position: number, duration: number, relay: boolean): number {
  if (relay) {
    return duration > 0 && position > duration - 2 ? Math.max(0, duration - 2) : position;
  }

  if (position < 0) {
    position = 0;
  }
  if (duration > 0 && position > duration - 1) {
    position = duration - 1;
  }
  return position;
}
