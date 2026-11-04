export interface Identifiable {
  id?: string | number | null;
  seriesId?: string | number | null;
  _seriesId?: string | number | null;
}

export interface HistoryItem extends Identifiable {
  seasons?: ReadonlyArray<Identifiable>;
}

export interface EpisodeContainer {
  episodes?: ReadonlyArray<Identifiable>;
}

export function findHistoryEntry<T extends Identifiable>(
  history: ReadonlyArray<T> | null | undefined,
  item: HistoryItem | null | undefined
): T | null {
  if (!item || !item.id) {
    return null;
  }

  const id = String(item.id);
  const seriesId = item._seriesId ? String(item._seriesId) : "";
  for (const entry of history ?? []) {
    const entrySeries = entry.seriesId ? String(entry.seriesId) : "";
    if (
      String(entry.id) === id
      || (entrySeries && (entrySeries === id || entrySeries === seriesId))
      || (seriesId && String(entry.id) === seriesId)
    ) {
      return entry;
    }
  }

  return null;
}

export function episodeIdExists(
  item: EpisodeContainer | null | undefined,
  id: string | number | null | undefined
): boolean {
  if (!item || !item.episodes || !id) {
    return false;
  }

  return item.episodes.some((episode) => String(episode.id) === String(id));
}
