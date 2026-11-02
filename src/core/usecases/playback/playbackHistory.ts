import type { Identifiable } from "../catalog/history";

export interface PlaybackHistoryItem extends Identifiable {
  title?: string;
  name?: string;
  poster?: string;
  cover?: string;
  duration?: number;
  _seriesId?: string | number | null;
}

export interface PlaybackHistoryEpisode extends Identifiable {
  number?: string | number;
  seriesNumber?: string | number;
  title?: string;
  name?: string;
}

export interface PlaybackHistoryEntry {
  id: string;
  title: string;
  poster: string;
  series: boolean;
  seriesId: string;
  seasonId: string;
  episodeId: string;
  episodeNumber: string | number;
  episodeTitle: string;
  position: number;
  duration: number;
  updatedAt: number;
}

export function updatePlaybackHistory<T extends Identifiable>(
  history: ReadonlyArray<T>,
  item: PlaybackHistoryItem,
  episode: PlaybackHistoryEpisode | null | undefined,
  position: number,
  duration: number,
  now: number,
  series: boolean,
  context: { seriesId?: string | number | null; seasonId?: string | number | null } = {}
): Array<T | PlaybackHistoryEntry> {
  const id = String(item.id);
  const seriesId = String(context.seriesId || item._seriesId || item.id);
  const result: Array<T | PlaybackHistoryEntry> = [{
    id,
    title: item.title || item.name || "Contenido",
    poster: item.poster || item.cover || "",
    series,
    seriesId,
    seasonId: String(context.seasonId || item.id),
    episodeId: episode && episode.id ? String(episode.id) : "",
    episodeNumber: episode && (episode.number || episode.seriesNumber) || "",
    episodeTitle: episode && (episode.title || episode.name) || "",
    position: Math.floor(position),
    duration: Math.floor(duration || item.duration || 0),
    updatedAt: now
  }];

  for (let i = 0; i < history.length && result.length < 30; i++) {
    const entry = history[i]!;
    const entrySeries = entry.seriesId ? String(entry.seriesId) : String(entry.id);
    if (String(entry.id) !== id && entrySeries !== seriesId) {
      result.push(entry);
    }
  }
  return result;
}
