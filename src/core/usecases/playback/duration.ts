function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function formatPlaybackTime(value: number): string {
  const total = Math.max(0, Math.floor(value || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function parsePlaybackDuration(value: unknown): number {  if (typeof value === "number" && isFinite(value) && value > 0) return value;
  if (typeof value !== "string") return 0;

  const text = value.trim();
  if (!text || text === "—" || text === "-") return 0;

  const hours = text.match(/(\d+)\s*h(?:our|ora|s)?/i);
  const minutes = text.match(/(\d+)\s*m(?:in|uto|s)?/i);
  const seconds = text.match(/(\d+)\s*s(?:ec|eg)?/i);
  if (hours || minutes || seconds) {
    return 3600 * (hours ? parseInt(hours[1] ?? "0", 10) : 0)
      + 60 * (minutes ? parseInt(minutes[1] ?? "0", 10) : 0)
      + (seconds ? parseInt(seconds[1] ?? "0", 10) : 0);
  }

  if (text.indexOf(":") !== -1) {
    const parts = text.split(":");
    if (parts.length === 2) {
      const first = Number(parts[0]);
      const second = Number(parts[1]);
      if (isFinite(first) && isFinite(second) && first >= 0 && second >= 0) {
        return 60 * first + second;
      }
    } else if (parts.length === 3) {
      const first = Number(parts[0]);
      const second = Number(parts[1]);
      const third = Number(parts[2]);
      if (
        isFinite(first) && isFinite(second) && isFinite(third)
        && first >= 0 && second >= 0 && third >= 0
      ) {
        return 3600 * first + 60 * second + third;
      }
    }
  }

  const direct = Number(text);
  return isFinite(direct) && direct > 0 ? direct : 0;
}

export function playbackPercent(value: number, total: number): number {
  if (!(total > 0)) return 0;
  return Math.min(100, Math.max(0, (value / total) * 100));
}

export function resolvePlaybackDuration(
  candidates: unknown[],
  series: boolean,
  position: number
): number {
  let bestBelowPosition = 0;
  for (const candidate of candidates) {
    const parsed = parsePlaybackDuration(candidate);
    if (!parsed) continue;
    if (parsed >= position - 2) return parsed;
    if (parsed > bestBelowPosition) bestBelowPosition = parsed;
  }

  let fallback = series ? 2700 : 6300;
  if (position > fallback) {
    fallback = Math.round(1.15 * position);
  }
  return Math.max(bestBelowPosition, fallback);
}

export function inferEpisodeDuration(episodes: unknown[], current: unknown): number {
  const counts = new Map<number, number>();
  for (const episode of episodes) {
    if (!episode || episode === current) continue;
    const parsed = parsePlaybackDuration((episode as { duration?: unknown }).duration);
    if (parsed > 0) {
      counts.set(parsed, (counts.get(parsed) ?? 0) + 1);
    }
  }

  let best = 0;
  let bestCount = 0;
  for (const [duration, count] of counts) {
    if (count > bestCount || (count === bestCount && duration > best)) {
      best = duration;
      bestCount = count;
    }
  }
  return best;
}
