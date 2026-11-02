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
    seasonId?: string;
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

  let bestIndex = -1;
  let bestNumber = Infinity;
  for (let i = 0; i < seasons.length; i++) {
    const number = Number(seasons[i]?.number);
    if (isFinite(number) && number > currentNumber && number < bestNumber) {
      bestIndex = i;
      bestNumber = number;
    }
  }
  return bestIndex;
}

export function findEpisodeIndex(episodes: EpisodeLike[], current: unknown): number {
  const episode = current as EpisodeLike | null;
  for (let i = 0; i < episodes.length; i++) {
    const item = episodes[i];
    if (episode && (item?.id === episode.id || item?.number === episode.number)) {
      return i;
    }
  }
  return -1;
}
