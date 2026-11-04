import { findHistoryEntry, type Identifiable } from "../../core/usecases/catalog/history";
import { shouldPersistPlaybackHistory } from "../../core/usecases/playback/playbackProgress";
import { updatePlaybackHistory } from "../../core/usecases/playback/playbackHistory";
import type { AppState } from "./state";
import type { ServiceCallback } from "./service";

export interface HistoryEntry extends Identifiable {
  title?: string;
  poster?: string;
  seasonId?: string | number | null;
  seriesId?: string | number | null;
  episodeId?: string;
  [key: string]: unknown;
}

export interface HistoryProfile {
  history?: HistoryEntry[];
  [key: string]: unknown;
}

export interface HistoryItem extends Identifiable {
  title?: string;
  name?: string;
  alias?: string;
  poster?: string;
  cover?: string;
  duration?: number;
  episodes?: Array<Record<string, unknown>>;
  seasons?: Array<Record<string, unknown>>;
  seasonId?: string | number | null;
  _seriesId?: string | number | null;
  _portal?: boolean;
  _detailsLoaded?: boolean;
  [key: string]: unknown;
}

export interface HistoryRuntimeDeps {
  state: AppState;
  getCatalog(): HistoryItem[];
  getProfile(): HistoryProfile;
  saveProfile(): void;
  requestSearch(params: Record<string, unknown>, done: ServiceCallback): boolean;
  buildSearchParams(kind: string, value?: unknown): Record<string, unknown>;
  extract(payload: unknown): HistoryItem[];
  normalize(item: unknown, index?: number): HistoryItem;
  isSeries(item: unknown): boolean;
  openDetail(item: HistoryItem): void;
  loadSeasonEpisodes(
    item: HistoryItem,
    season: Record<string, unknown>,
    done: (episodes: Array<Record<string, unknown>>) => void
  ): void;
  renderDetail(item: HistoryItem): void;
  resolveEpisode(
    entry: HistoryEntry,
    episodes: Array<Record<string, unknown>>
  ): Record<string, unknown> | null;
  log(message: string, payload: Record<string, unknown>): void;
}

export interface HistoryRuntime {
  find(item: HistoryItem | null | undefined): HistoryEntry | null;
  save(position: number, total: number, force?: boolean): void;
  sync(item: HistoryItem): void;
  open(entry: HistoryEntry): void;
}

function normalizedTitle(value: unknown): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

export function createHistoryRuntime(deps: HistoryRuntimeDeps): HistoryRuntime {
  let lastSaveAt = 0;

  function find(item: HistoryItem | null | undefined): HistoryEntry | null {
    return findHistoryEntry(deps.getProfile().history, item as never) as HistoryEntry | null;
  }

  function save(position: number, total: number, force?: boolean): void {
    const state = deps.state;
    const item = state.playerItem as HistoryItem | null;
    const now = Date.now();
    if (
      state.noHistorySave
      || !item
      || !shouldPersistPlaybackHistory(position, item.id, now, lastSaveAt, Boolean(force))
    ) {
      return;
    }
    lastSaveAt = now;
    const profile = deps.getProfile();
    const seriesId = String(item._seriesId || item.id);
    const seasonId = String(item.seasonId || item.id);
    profile.history = updatePlaybackHistory(
      profile.history || [],
      item as never,
      state.playerEpisode as never,
      position,
      total,
      now,
      deps.isSeries(item),
      { seriesId, seasonId }
    ) as HistoryEntry[];
    deps.saveProfile();
  }

  function sync(item: HistoryItem): void {
    const entry = find(item);
    if (!entry || !entry.episodeId) {
      return;
    }
    const state = deps.state;
    const targetSeason = entry.seasonId ? String(entry.seasonId) : "";
    const seasons = item.seasons || [];
    let seasonIndex = -1;
    if (targetSeason) {
      for (let index = 0; index < seasons.length; index += 1) {
        if (String(seasons[index]!.id) === targetSeason) {
          seasonIndex = index;
          break;
        }
      }
    }
    if (seasonIndex >= 0) {
      const season = seasons[seasonIndex]!;
      state.detailSeason = seasonIndex;
      if (String(season.id) !== String(item.seasonId || "")) {
        if (season._episodes) {
          item.seasonId = season.id as string | number | null;
          item.episodes = season._episodes as Array<Record<string, unknown>>;
        } else {
          deps.loadSeasonEpisodes(item, season, function episodesLoaded(episodes) {
            item.seasonId = season.id as string | number | null;
            item.episodes = episodes;
            season._episodes = episodes;
            if (
              state.playerEpisode
              && String((state.playerEpisode as { id?: unknown }).id) === String(entry.episodeId)
            ) {
              for (const episode of episodes) {
                if (String(episode.id) === String(entry.episodeId)) {
                  state.detailEpisode = episode;
                  state.playerEpisode = episode;
                  break;
                }
              }
            }
            if (state.detail === item && state.screen === "detail") {
              deps.renderDetail(item);
            }
          });
        }
      }
    }
    if (entry.seriesId) item._seriesId = entry.seriesId;
    if (entry.title) item.title = entry.title;
    if (entry.poster) item.poster = entry.poster;
    if (entry.id) item.id = entry.id;
    const episode = deps.resolveEpisode(entry, item.episodes || []);
    state.detailEpisode = episode;
    state.playerEpisode = episode;
  }

  function open(entry: HistoryEntry): void {
    if (!entry || !entry.id) {
      return;
    }
    const catalog = deps.getCatalog();
    for (const item of catalog) {
      if (String(item.id) === String(entry.id)) {
        if (!item._detailsLoaded) item._portal = true;
        deps.openDetail(item);
        return;
      }
    }
    const title = normalizedTitle(entry.title);
    if (title) {
      for (const item of catalog) {
        const candidate = normalizedTitle(item.title);
        const alias = normalizedTitle(item.alias);
        if (candidate === title || alias === title) {
          deps.log("history title match", {
            historyId: entry.id,
            title: entry.title,
            matchedId: item.id
          });
          if (!item._detailsLoaded) item._portal = true;
          deps.openDetail(item);
          return;
        }
      }
    }
    deps.log("history title not matched", { historyId: entry.id, title: entry.title });
    const openFallback = function openFallback(): void {
      const normalized = deps.normalize(entry, 0);
      normalized._portal = true;
      deps.openDetail(normalized);
    };
    if (entry.title) {
      try {
        deps.requestSearch(
          deps.buildSearchParams("search", entry.title),
          function searchDone(error, response) {
            if (!error) {
              const results = deps.extract(response);
              const target = normalizedTitle(entry.title);
              for (const result of results) {
                if (normalizedTitle(result.title) === target) {
                  const found = deps.normalize(result, 0);
                  found._portal = true;
                  deps.log("history search match", {
                    historyId: entry.id,
                    matchedId: found.id
                  });
                  deps.openDetail(found);
                  return;
                }
              }
            }
            openFallback();
          }
        );
        return;
      } catch {
        // fall through to normalized fallback
      }
    }
    openFallback();
  }

  return { find, save, sync, open };
}
