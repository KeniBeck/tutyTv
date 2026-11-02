import {
  findEpisodeIndex,
  nextSeasonIndex,
  seasonEpisodes,
  type EpisodeLike,
  type SeasonLike
} from "../catalog/episodeNavigation";

export interface NextPlaybackTarget {
  kind: "episode" | "season";
  seasonIndex: number;
  episode?: EpisodeLike;
  season?: SeasonLike;
}

export function resolveNextPlaybackTarget(
  seasons: SeasonLike[],
  preferredSeasonIndex: number,
  fallbackSeasonIndex: number,
  currentEpisodes: EpisodeLike[],
  currentEpisode: EpisodeLike | null | undefined
): NextPlaybackTarget | null {
  let seasonIndex = preferredSeasonIndex;
  let episodes = currentEpisodes;
  let episodeIndex = findEpisodeIndex(episodes, currentEpisode);

  if (episodeIndex < 0 && fallbackSeasonIndex !== seasonIndex) {
    const fallbackEpisodes = seasonEpisodes({ seasons, seasonId: seasons[fallbackSeasonIndex]?.id, episodes: [] }, fallbackSeasonIndex);
    const fallbackEpisodeIndex = findEpisodeIndex(fallbackEpisodes, currentEpisode);
    if (fallbackEpisodeIndex >= 0) {
      seasonIndex = fallbackSeasonIndex;
      episodes = fallbackEpisodes;
      episodeIndex = fallbackEpisodeIndex;
    }
  }

  if (episodeIndex < 0) return null;

  if (episodeIndex + 1 < episodes.length) {
    return {
      kind: "episode",
      seasonIndex,
      episode: episodes[episodeIndex + 1]!
    };
  }

  const nextIndex = nextSeasonIndex(seasons, seasonIndex);
  if (nextIndex < 0) return null;

  return {
    kind: "season",
    seasonIndex: nextIndex,
    season: seasons[nextIndex]!
  };
}
