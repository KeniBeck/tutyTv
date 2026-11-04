import { episodeIdExists } from "../../core/usecases/catalog/history";
import { resolveDetailSeason } from "../../core/usecases/catalog/episodeNavigation";
import { resolveResumePlan } from "../../core/usecases/playback/resumePlan";
import type { AppState } from "./state";

export interface DetailItem {
  id?: string | number | null;
  title?: string;
  alias?: string;
  _seriesId?: unknown;
  _detailsLoaded?: boolean;
  _detailPlaybackHandled?: boolean;
  episodes?: Array<Record<string, unknown>>;
  seasons?: Array<Record<string, unknown>>;
  seasonId?: unknown;
  [key: string]: unknown;
}

export interface DetailHistory {
  position?: unknown;
  duration?: unknown;
  series?: unknown;
  episodeId?: string;
  episodeNumber?: unknown;
  episodeTitle?: unknown;
  [key: string]: unknown;
}

export interface DetailRuntimeDeps {
  state: AppState;
  byId(id: string): { classList: { add(name: string): void } } | null;
  focus(node: unknown): void;
  getDetailFocusable(): unknown;
  getPlayerStage(): unknown;
  findHistory(item: DetailItem): DetailHistory | null;
  syncMediaInfo(item: DetailItem): void;
  resetPlayerItem(): void;
  prepareItem(item: DetailItem): void;
  refreshMediaInfo(item: DetailItem): void;
  renderDetail(item: DetailItem): void;
  showScreen(name: string): void;
  ensurePlayerStage(): void;
  notifyStatus(message: string): void;
  loadDetail(item: DetailItem, done: (item: DetailItem | null) => void): void;
  askResume(
    item: DetailItem,
    episode: unknown,
    position: number,
    duration: number,
    done: (continuePlayback: boolean) => void
  ): boolean;
  resetStream(): void;
  startPlayback(item: DetailItem, episode: unknown): void;
  isSeries(item: DetailItem): boolean;
  log(message: string, payload: Record<string, unknown>): void;
}

export interface DetailRuntime {
  open(item: DetailItem): void;
  start(item: DetailItem): void;
}

export function createDetailRuntime(deps: DetailRuntimeDeps): DetailRuntime {
  function open(item: DetailItem): void {
    const state = deps.state;
    if (
      state.screen === "detail"
      && state.detail === item
      && (state.resumeOpen || item._detailPlaybackHandled)
    ) {
      if (!state.resumeOpen) {
        deps.focus(deps.getDetailFocusable());
      }
      return;
    }
    item._seriesId = item._seriesId || item.id;
    state.detail = item;
    state.detailReturn = { screen: state.screen, focus: state.focus };
    state.detailRange = 0;
    state.detailSeason = 0;
    state.detailEpisode = null;
    state.playerEpisode = null;
    if (item.seasons && item.seasons.length) {
      const resolved = resolveDetailSeason(
        item.seasons as never,
        item.id,
        item.seasonId,
        item.title || item.alias || ""
      );
      state.detailSeason = resolved.seasonIndex;
      if (resolved.seasonId) item.seasonId = resolved.seasonId;
    }
    if (item.episodes && item.episodes.length) {
      state.detailEpisode = item.episodes[0];
    }
    deps.syncMediaInfo(item);
    deps.resetPlayerItem();
    deps.prepareItem(item);
    deps.refreshMediaInfo(item);
    deps.renderDetail(item);
    deps.showScreen("detail");
    if (!deps.getPlayerStage()) {
      deps.ensurePlayerStage();
    }
    const player = deps.byId("screen-player");
    if (player) {
      player.classList.add("is-mini");
      player.classList.add("is-active");
    }
    deps.focus(deps.getDetailFocusable());
    item._detailPlaybackHandled = false;
    if (item._detailsLoaded) {
      start(item);
      return;
    }
    deps.notifyStatus("Preparando la reproducción…");
    deps.loadDetail(item, function detailLoaded(loaded) {
      if (loaded && deps.state.screen === "detail" && deps.state.detail === loaded) {
        deps.syncMediaInfo(loaded);
        start(loaded);
      }
    });
  }

  function start(item: DetailItem): void {
    const state = deps.state;
    item._detailPlaybackHandled = true;
    const history = deps.findHistory(item);
    const count = item.episodes ? item.episodes.length : 0;
    const exists = history && history.episodeId
      ? episodeIdExists(item as never, history.episodeId)
      : false;
    const plan = resolveResumePlan(
      history as never,
      state.detailEpisode as { id?: unknown } | null,
      count,
      deps.isSeries(item),
      exists
    );
    state.resumePosition = 0;
    deps.log("resume", {
      id: item.id,
      historyPosition: history && history.position,
      duration: plan.duration,
      series: plan.isSeries,
      episodes: plan.episodeCount,
      historyEpisode: history && history.episodeId,
      currentEpisode: (state.detailEpisode as { id?: unknown } | null)?.id,
      reset: plan.mismatchReset,
      show: plan.shouldPrompt
    });
    if (plan.shouldPrompt) {
      deps.resetStream();
      try {
        deps.askResume(item, state.detailEpisode, plan.position, plan.duration, function resumed(cont) {
          state.resumePosition = cont ? plan.position : 0;
          deps.startPlayback(item, state.detailEpisode);
        });
      } catch (error) {
        deps.log("resume modal error", { error: String(error) });
        state.resumePosition = 0;
        deps.startPlayback(item, state.detailEpisode);
      }
      return;
    }
    deps.startPlayback(item, state.detailEpisode);
  }

  return { open, start };
}
