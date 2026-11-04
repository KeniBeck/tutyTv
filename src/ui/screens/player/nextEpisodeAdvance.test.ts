import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppState } from "../../runtime/state";
import type { NextEpisodeTarget } from "./nextEpisodePrompt";
import {
  attachNextEpisodeAdvance,
  findNextPlaybackTarget,
  offerNextEpisodeOnEnded,
  refreshNextEpisodeSeasons,
  resetNextEpisodeAdvanceRuntime,
  startNextEpisode,
  type AdvanceDetailResponse,
  type AdvanceEpisode,
  type AdvanceItem,
  type AdvanceSeason,
  type NextEpisodeAdvanceHost
} from "./nextEpisodeAdvance";

function episodeIndex(episodes: AdvanceEpisode[], episode: AdvanceEpisode | null): number {
  if (!episode) {
    return -1;
  }
  for (let index = 0; index < episodes.length; index += 1) {
    const current = episodes[index]!;
    if (current.id !== undefined && String(current.id) === String(episode.id)) {
      return index;
    }
    if (
      current.number !== undefined &&
      episode.number !== undefined &&
      String(current.number) === String(episode.number)
    ) {
      return index;
    }
  }
  return -1;
}

function resolveNext(
  seasons: AdvanceSeason[],
  preferred: number,
  fallback: number,
  episodes: AdvanceEpisode[],
  episode: AdvanceEpisode | null
): NextEpisodeTarget | null {
  let seasonIndex = preferred;
  let list = episodes;
  let index = episodeIndex(list, episode);
  if (index < 0 && fallback !== seasonIndex) {
    const fallbackEpisodes = seasons[fallback]?._episodes || [];
    const fallbackIndex = episodeIndex(fallbackEpisodes, episode);
    if (fallbackIndex >= 0) {
      seasonIndex = fallback;
      list = fallbackEpisodes;
      index = fallbackIndex;
    }
  }
  if (index < 0) {
    return null;
  }
  if (index + 1 < list.length) {
    return { kind: "episode", seasonIndex, episode: list[index + 1]! };
  }
  if (seasonIndex + 1 < seasons.length) {
    return { kind: "season", seasonIndex: seasonIndex + 1, season: seasons[seasonIndex + 1]! };
  }
  return null;
}

function createHarness() {
  const state = createAppState();
  state.screen = "player";
  state.playerMode = "vod";
  const episode1: AdvanceEpisode = { id: "e1", number: 1 };
  const episode2: AdvanceEpisode = { id: "e2", number: 2 };
  const episode3: AdvanceEpisode = { id: "e3", number: 1 };
  const seasons: AdvanceSeason[] = [
    { id: "s1", number: 1, _episodes: [episode1, episode2] },
    { id: "s2", number: 2, _episodes: [episode3] }
  ];
  const item: AdvanceItem = {
    id: "series",
    title: "Serie",
    seasonId: "s1",
    episodes: [episode1, episode2],
    seasons
  };
  state.playerItem = item;
  state.playerEpisode = episode2;
  state.playerSeasonIndex = 0;
  state.detailSeason = 0;
  state.detail = item;
  const resetStream = vi.fn();
  const showLoading = vi.fn();
  const hideLoading = vi.fn();
  const switchEpisode = vi.fn();
  const mergeDetail = vi.fn();
  const refreshSeasons = vi.fn();
  const notify = vi.fn();
  const getPosition = vi.fn(() => 100);
  const getTotal = vi.fn(() => 1000);
  const requestDetail = vi.fn();
  const resolveSeason = vi.fn((_items: AdvanceSeason[]) => ({ seasonIndex: 0 }));
  let pendingSeason: ((episodes: AdvanceEpisode[], detail: unknown) => void) | null = null;

  const host: NextEpisodeAdvanceHost = {
    state,
    isSeries: () => true,
    seasons: () => seasons,
    seasonEpisodes: (target, index) => {
      const season = seasons[index];
      if (!season) {
        return [];
      }
      return season.id === (target.seasonId || target.id) && target.episodes && target.episodes.length
        ? target.episodes
        : season._episodes || [];
    },
    findEpisodeIndex: episodeIndex,
    resolveNext,
    refreshSeasons,
    resetStream,
    showLoading,
    hideLoading,
    switchEpisode,
    loadSeasonEpisodes: (_item, _season, done) => {
      pendingSeason = done;
    },
    mergeDetail,
    notify,
    requestDetail,
    resolveSeason,
    getPosition,
    getTotal
  };
  attachNextEpisodeAdvance(host);
  return {
    state,
    item,
    seasons,
    episode1,
    episode2,
    episode3,
    resetStream,
    showLoading,
    hideLoading,
    switchEpisode,
    mergeDetail,
    refreshSeasons,
    notify,
    respondSeason(episodes: AdvanceEpisode[], detail: unknown = null) {
      pendingSeason?.(episodes, detail);
    },
    host
  };
}

afterEach(() => {
  resetNextEpisodeAdvanceRuntime();
  vi.clearAllMocks();
});

describe("nextEpisodeAdvance", () => {
  it("finds the next episode in the current season", () => {
    const harness = createHarness();
    harness.state.playerEpisode = harness.episode1;

    expect(findNextPlaybackTarget()).toEqual({
      kind: "episode",
      seasonIndex: 0,
      episode: harness.episode2
    });
  });

  it("advances to the next season after the last episode", () => {
    const harness = createHarness();
    harness.state.playerEpisode = harness.episode2;
    harness.seasons[0]!._episodes = [harness.episode1, harness.episode2];
    harness.item.episodes = [harness.episode1];

    harness.state.playerEpisode = harness.episode1;
    harness.item.episodes = [harness.episode1, harness.episode2];
    expect(findNextPlaybackTarget()).toEqual({
      kind: "episode",
      seasonIndex: 0,
      episode: harness.episode2
    });

    harness.state.playerEpisode = harness.episode2;
    expect(findNextPlaybackTarget()).toEqual({
      kind: "season",
      seasonIndex: 1,
      season: harness.seasons[1]!
    });
  });

  it("uses the item season id to repair a stale preferred season", () => {
    const harness = createHarness();
    harness.item.seasonId = "s2";
    harness.item.episodes = [harness.episode3];
    harness.item.seasons = harness.seasons;
    harness.state.playerEpisode = harness.episode3;
    harness.state.playerSeasonIndex = 0;
    harness.state.detailSeason = 0;

    expect(findNextPlaybackTarget()).toBeNull();
  });

  it("does not offer a target outside the player or for non-series", () => {
    const harness = createHarness();
    harness.state.screen = "detail";
    expect(findNextPlaybackTarget()).toBeNull();
    harness.state.screen = "player";
    harness.host.isSeries = () => false;
    expect(findNextPlaybackTarget()).toBeNull();
  });

  it("starts an episode immediately and skips duplicates", () => {
    const harness = createHarness();
    const target: NextEpisodeTarget = {
      kind: "episode",
      seasonIndex: 0,
      episode: harness.episode1
    };

    expect(startNextEpisode(target)).toBe(true);
    expect(harness.resetStream).toHaveBeenCalledTimes(1);
    expect(harness.showLoading).toHaveBeenCalledWith(harness.item);
    expect(harness.switchEpisode).toHaveBeenCalledWith(harness.item, harness.episode1, false);
    expect(harness.state.detailSeason).toBe(0);
    expect(harness.state.playerSeasonIndex).toBe(0);
    expect(harness.state.nextEpisodeGuardUntil).toBeGreaterThan(Date.now());

    harness.state.playerEpisode = harness.episode1;
    expect(startNextEpisode(target)).toBe(false);
    expect(harness.switchEpisode).toHaveBeenCalledTimes(1);
  });

  it("loads the next season, merges details and starts its first episode", () => {
    const harness = createHarness();
    const target: NextEpisodeTarget = {
      kind: "season",
      seasonIndex: 1,
      season: harness.seasons[1]!
    };
    const detail = { title: "Serie T2" };

    expect(startNextEpisode(target)).toBe(true);
    expect(harness.showLoading).toHaveBeenCalledTimes(1);
    expect(harness.switchEpisode).not.toHaveBeenCalled();

    harness.respondSeason([harness.episode3], detail);

    expect(harness.mergeDetail).toHaveBeenCalledWith(harness.item, detail);
    expect(harness.item.seasons).toBe(harness.seasons);
    expect(harness.item.seasonId).toBe("s2");
    expect(harness.item.episodes).toEqual([harness.episode3]);
    expect(harness.seasons[1]?._episodes).toEqual([harness.episode3]);
    expect(harness.state.detailSeason).toBe(1);
    expect(harness.state.playerSeasonIndex).toBe(1);
    expect(harness.state.detailNeedsRebuild).toBe(true);
    expect(harness.switchEpisode).toHaveBeenCalledWith(harness.item, harness.episode3, false);
  });

  it("ignores stale season loads and hides loading when there are no episodes", () => {
    const harness = createHarness();
    const target: NextEpisodeTarget = {
      kind: "season",
      seasonIndex: 1,
      season: harness.seasons[1]!
    };
    startNextEpisode(target);
    harness.state.nextEpisodeSeq += 1;
    harness.respondSeason([harness.episode3]);
    expect(harness.switchEpisode).not.toHaveBeenCalled();

    harness.resetStream.mockClear();
    harness.state.nextEpisodeSeq = 0;
    startNextEpisode(target);
    harness.respondSeason([]);
    expect(harness.hideLoading).toHaveBeenCalledTimes(1);
    expect(harness.switchEpisode).not.toHaveBeenCalled();
  });

  it("returns false without a target or runtime", () => {
    const harness = createHarness();
    expect(startNextEpisode(null)).toBe(false);
    resetNextEpisodeAdvanceRuntime();
    expect(findNextPlaybackTarget()).toBeNull();
    expect(startNextEpisode({ kind: "episode", seasonIndex: 0, episode: { id: "e1" } }))
      .toBe(false);
    expect(harness.resetStream).not.toHaveBeenCalled();
  });
  it("refreshes seasons and resolves the current season", () => {
    const harness = createHarness();
    const requestDetail = vi.fn();
    harness.host.requestDetail = requestDetail;
    harness.host.resolveSeason = vi.fn(() => ({ seasonIndex: 1, seasonId: "s2new" }));

    expect(refreshNextEpisodeSeasons(harness.item)).toBe(true);
    expect(harness.item._nextSeasonsLoading).toBe(true);
    const done = requestDetail.mock.calls[0]?.[1] as
      ((error: unknown, response: AdvanceDetailResponse | null) => void);
    done(null, {
      returnValue: true,
      seasons: [
        { id: "s2new", number: 3 },
        { id: "s1new", number: 1 }
      ]
    });

    expect(harness.item.seasons?.map((season) => season.id)).toEqual(["s1new", "s2new"]);
    expect(harness.item._nextSeasonsLoading).toBe(false);
    expect(harness.item._nextSeasonsTried).toBe(true);
    expect(harness.item.seasonId).toBe("s2new");
    expect(harness.state.detailSeason).toBe(1);
    expect(refreshNextEpisodeSeasons(harness.item)).toBe(false);
  });

  it("hides loading when the ended event cannot offer a next episode", () => {
    const harness = createHarness();
    harness.state.nextEpisodeDismissed = true;

    expect(offerNextEpisodeOnEnded()).toBe(false);
    expect(harness.hideLoading).toHaveBeenCalled();
  });

});
