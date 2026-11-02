export interface SeasonLike {
  id?: string;
  number?: number;
  _episodes?: unknown[];
  [key: string]: unknown;
}

export interface EpisodeLike {
  id?: string;
  number?: number;
  [key: string]: unknown;
}

export function seasonList(item: unknown): SeasonLike[] {
  const value = item as { seasons?: SeasonLike[]; id?: string } | null;
  if (value?.seasons && value.seasons.length) return value.seasons;
  return [{ id: value?.id || "", number: 1 }];
}

export function seasonEpisodes(item: unknown, seasonIndex: number): EpisodeLike[] {
  const value = item as {
    id?: string;
    seasonId?: string | undefined;
    episodes?: EpisodeLike[];
  } | null;
  const seasons = seasonList(value);
  const season = seasons[seasonIndex] || seasons[0];
  if (!season) return [];
  if (
    season.id === (value?.seasonId || value?.id)
    && value?.episodes
    && value.episodes.length
  ) {
    return value.episodes;
  }
  return (season._episodes as EpisodeLike[] | undefined) || [];
}

export function nextSeasonIndex(seasons: SeasonLike[], currentIndex: number): number {
  const current = seasons[currentIndex];
  const currentNumber = Number(current?.number);
  if (!isFinite(currentNumber)) {
    return currentIndex + 1 < seasons.length ? currentIndex + 1 : -1;
  }

  const nextArray = seasons[currentIndex + 1];
  if (nextArray && Number(nextArray.number) === currentNumber) {
    return currentIndex + 1;
  }

  let bestIndex = -1;
  let bestNumber = Infinity;
  for (let i = 0; i < seasons.length; i++) {
    const number = Number(seasons[i]?.number);
    if (isFinite(number) && number > currentNumber && number < bestNumber) {
      bestIndex = i;
      bestNumber = number;
    }
  }
  if (bestIndex >= 0) return bestIndex;
  return currentIndex + 1 < seasons.length ? currentIndex + 1 : -1;
}

export function findEpisodeIndex(episodes: EpisodeLike[], current: unknown): number {
  const episode = current as EpisodeLike | null;
  for (let i = 0; i < episodes.length; i++) {
    const item = episodes[i];
    if (!episode || !item) continue;
    const idMatches = episode.id !== undefined && episode.id !== null && item.id === episode.id;
    const numberMatches = episode.number !== undefined
      && episode.number !== null
      && item.number !== undefined
      && item.number !== null
      && String(item.number) === String(episode.number);
    if (idMatches || numberMatches) {
      return i;
    }
  }
  return -1;
}

export interface DetailSeasonResolution {
  seasonIndex: number;
  seasonId?: string | undefined;
}

export function resolveDetailSeason(
  seasons: ReadonlyArray<SeasonLike>,
  itemId: unknown,
  currentSeasonId: unknown,
  title: unknown
): DetailSeasonResolution {
  if (!seasons.length) return { seasonIndex: 0 };

  const currentId = currentSeasonId ? String(currentSeasonId) : "";
  const rootId = itemId ? String(itemId) : "";
  for (let index = 0; index < seasons.length; index++) {
    if (currentId && String(seasons[index]?.id || "") === currentId) {
      return { seasonIndex: index, seasonId: seasons[index]?.id };
    }
  }
  if (rootId) {
    for (let index = 0; index < seasons.length; index++) {
      if (String(seasons[index]?.id || "") === rootId) {
        return { seasonIndex: index, seasonId: seasons[index]?.id };
      }
    }
  }

  const titleMatch = /(?:temp(?:orada)?|season|t)\s*\.?\s*(\d+)/i.exec(String(title || "").replace(/-/g, " "));
  const titleNumber = titleMatch ? parseInt(titleMatch[1] || "", 10) : 0;
  if (titleNumber > 0) {
    for (let index = 0; index < seasons.length; index++) {
      if (Number(seasons[index]?.number) === titleNumber) {
        return { seasonIndex: index, seasonId: seasons[index]?.id };
      }
    }
  }

  return { seasonIndex: 0, seasonId: seasons[0]?.id };
}
