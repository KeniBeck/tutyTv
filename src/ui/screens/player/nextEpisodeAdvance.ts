import type { AppState } from "../../runtime/state";
import {
  canOfferNextEpisode,
  showNextEpisodePrompt,
  type NextEpisodeItem,
  type NextEpisodeSeason,
  type NextEpisodeTarget
} from "./nextEpisodePrompt";

export interface AdvanceEpisode extends NextEpisodeItem {
  id?: string | number;
  number?: string | number;
  seriesNumber?: string | number;
}

export interface AdvanceSeason extends NextEpisodeSeason {
  id?: string;
  number?: string | number;
  _episodes?: AdvanceEpisode[];
  [key: string]: unknown;
}

export interface AdvanceItem {
  id?: string | number;
  title?: string;
  seasonId?: string;
  episodes?: AdvanceEpisode[];
  seasons?: AdvanceSeason[];
  _detailsLoaded?: boolean;
  [key: string]: unknown;
}

export interface NextEpisodeAdvanceHost {
  state: AppState;
  isSeries(item: AdvanceItem): boolean;
  seasons(item: AdvanceItem): AdvanceSeason[];
  seasonEpisodes(item: AdvanceItem, seasonIndex: number): AdvanceEpisode[];
  findEpisodeIndex(episodes: AdvanceEpisode[], episode: AdvanceEpisode | null): number;
  resolveNext(
    seasons: AdvanceSeason[],
    preferredSeasonIndex: number,
    fallbackSeasonIndex: number,
    episodes: AdvanceEpisode[],
    episode: AdvanceEpisode | null
  ): NextEpisodeTarget | null;
  refreshSeasons(item: AdvanceItem): void;
  resetStream(): void;
  showLoading(item: AdvanceItem): void;
  hideLoading(): void;
  switchEpisode(item: AdvanceItem, episode: AdvanceEpisode, saveHistory: boolean): void;
  loadSeasonEpisodes(
    item: AdvanceItem,
    season: AdvanceSeason,
    done: (episodes: AdvanceEpisode[], detail: unknown) => void
  ): void;
  mergeDetail(item: AdvanceItem, detail: unknown): void;
  notify(message: string): void;
  requestDetail(
    itemId: string | number | undefined,
    done: (error: unknown, response: AdvanceDetailResponse | null) => void
  ): void;
  resolveSeason(
    seasons: AdvanceSeason[],
    item: AdvanceItem
  ): { seasonIndex: number; seasonId?: string };
  getPosition(): number;
  getTotal(): number;
  log?(message: string, payload: Record<string, unknown>): void;
}

export interface AdvanceDetailResponse {
  returnValue?: boolean;
  seasons?: AdvanceSeason[];
  [key: string]: unknown;
}

let host: NextEpisodeAdvanceHost | null = null;

export function attachNextEpisodeAdvance(next: NextEpisodeAdvanceHost): boolean {
  host = next;
  return true;
}

export function hasNextEpisodeAdvanceRuntime(): boolean {
  return host !== null;
}

export function resetNextEpisodeAdvanceRuntime(): void {
  host = null;
}

export function findNextPlaybackTarget(): NextEpisodeTarget | null {
  if (!host) {
    return null;
  }
  const state = host.state;
  const item = state.playerItem as AdvanceItem | null;
  if (!item || !host.isSeries(item) || state.screen !== "player") {
    return null;
  }
  const seasons = host.seasons(item);
  let preferred = Number(state.playerSeasonIndex) || 0;
  const targetId = String(item.seasonId || item.id || "");
  const fallback = Number(state.detailSeason) || 0;
  if (
    seasons[preferred] &&
    targetId &&
    String(seasons[preferred]?.id || "") !== targetId
  ) {
    for (let index = 0; index < seasons.length; index += 1) {
      if (String(seasons[index]?.id || "") === targetId) {
        preferred = index;
        break;
      }
    }
  }
  let episodes = host.seasonEpisodes(item, preferred);
  const current = state.playerEpisode as AdvanceEpisode | null;
  if (host.findEpisodeIndex(episodes, current) < 0 && fallback !== preferred) {
    const fallbackEpisodes = host.seasonEpisodes(item, fallback);
    if (host.findEpisodeIndex(fallbackEpisodes, current) >= 0) {
      preferred = fallback;
      episodes = fallbackEpisodes;
    }
  }
  const target = host.resolveNext(seasons, preferred, fallback, episodes, current);
  if (!target && seasons.length <= 1) {
    host.refreshSeasons(item);
  }
  if (!target) {
    host.log?.("next target not found", {
      item: item.id,
      seasonId: item.seasonId,
      preferred,
      fallback,
      episodes: episodes.length,
      episode: current && current.id,
      seasons: seasons.map((season) => ({
        id: season && season.id,
        number: season && season.number
      }))
    });
  }
  return target;
}

export function refreshNextEpisodeSeasons(item: AdvanceItem | null | undefined): boolean {
  if (!host || !item || item._nextSeasonsLoading || item._nextSeasonsTried) {
    return false;
  }
  item._nextSeasonsLoading = true;
  try {
    host.requestDetail(item.id, function onDetail(error, response) {
      if (!host) {
        return;
      }
      item._nextSeasonsLoading = false;
      item._nextSeasonsTried = true;
      if (
        !error
        && response
        && response.returnValue !== false
        && response.seasons
        && response.seasons.length
      ) {
        item.seasons = response.seasons.slice().sort(function sortSeasons(left, right) {
          return (parseInt(String(left.number), 10) || 0) - (parseInt(String(right.number), 10) || 0);
        });
        const resolved = host.resolveSeason(item.seasons, item);
        host.state.detailSeason = resolved.seasonIndex;
        if (resolved.seasonId) {
          item.seasonId = resolved.seasonId;
        }
        host.log?.("seasons refreshed", {
          item: item.id,
          seasons: item.seasons.length,
          seasonId: item.seasonId
        });
      }
      if (host.state.screen === "player" && host.isSeries(item)) {
        maybeShowNextEpisodePrompt(host.getPosition(), host.getTotal());
      }
    });
  } catch {
    item._nextSeasonsLoading = false;
    item._nextSeasonsTried = true;
  }
  return true;
}

export function maybeShowNextEpisodePrompt(position: number, total: number): boolean {
  if (!host || !canOfferNextEpisode(host.state, position, total)) {
    return false;
  }
  const target = findNextPlaybackTarget();
  if (!target) {
    return false;
  }
  host.log?.("next prompt", {
    trigger: "timeupdate",
    position,
    total,
    remaining: total - position,
    current: host.state.playerEpisode && (host.state.playerEpisode as AdvanceEpisode).id,
    target: target.episode && target.episode.id,
    kind: target.kind
  });
  return showNextEpisodePrompt(target, total - position);
}

export function offerNextEpisodeOnEnded(): boolean {
  if (!host) {
    return false;
  }
  const state = host.state;
  const item = state.playerItem as AdvanceItem | null;
  if (!item || !host.isSeries(item) || state.screen !== "player") {
    return false;
  }
  const position = host.getPosition();
  const total = host.getTotal();
  if (!canOfferNextEpisode(state, position, total)) {
    host.hideLoading();
    return false;
  }
  const target = findNextPlaybackTarget();
  if (!target) {
    host.hideLoading();
    return false;
  }
  host.log?.("next prompt", {
    trigger: "ended",
    position,
    total,
    remaining: total - position,
    current: state.playerEpisode && (state.playerEpisode as AdvanceEpisode).id,
    target: target.episode && target.episode.id,
    kind: target.kind
  });
  return showNextEpisodePrompt(target);
}

export function startNextEpisode(target: NextEpisodeTarget | null | undefined): boolean {
  if (!host || !target) {
    return false;
  }
  const state = host.state;
  const item = state.playerItem as AdvanceItem | null;
  if (!item) {
    return false;
  }
  if (target.kind === "episode" && !target.episode) {
    return false;
  }
  if (
    target.kind === "episode" &&
    target.episode &&
    state.playerEpisode &&
    String(target.episode.id) === String((state.playerEpisode as AdvanceEpisode).id)
  ) {
    return false;
  }
  const sequence = ++state.nextEpisodeSeq;
  state.nextEpisodeGuardUntil = Date.now() + 3000;
  host.log?.("next target", {
    kind: target.kind,
    seasonIndex: target.seasonIndex,
    seasonId: target.season && target.season.id,
    episodeId: target.episode && target.episode.id
  });
  host.resetStream();
  host.showLoading(item);
  if (target.kind === "episode") {
    state.detailSeason = target.seasonIndex;
    state.playerSeasonIndex = target.seasonIndex;
    host.switchEpisode(item, target.episode as AdvanceEpisode, false);
    return true;
  }
  const seasons = host.seasons(item);
  const season = target.season as AdvanceSeason | undefined;
  if (!season) {
    host.hideLoading();
    return false;
  }
  host.loadSeasonEpisodes(item, season, (episodes, detail) => {
    if (!host) {
      return;
    }
    if (
      sequence !== host.state.nextEpisodeSeq ||
      host.state.playerItem !== item ||
      host.state.screen !== "player"
    ) {
      return;
    }
    host.log?.("next season loaded", {
      seasonId: season.id,
      episodes: episodes && episodes.length
    });
    if (!episodes || !episodes.length) {
      host.hideLoading();
      return;
    }
    if (detail) {
      host.mergeDetail(item, detail);
    }
    item.seasons = seasons;
    host.state.detailSeason = target.seasonIndex;
    host.state.playerSeasonIndex = target.seasonIndex;
    if (season.id) {
      item.seasonId = season.id;
    }
    item.episodes = episodes;
    season._episodes = episodes;
    if (host.state.detail === item) {
      host.state.detailNeedsRebuild = true;
    }
    host.switchEpisode(item, episodes[0] as AdvanceEpisode, false);
  });
  return true;
}
