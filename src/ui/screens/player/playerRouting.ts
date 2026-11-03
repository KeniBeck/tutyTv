import type { AppState } from "../../runtime/state";

export interface RoutedItem {
  id?: string | number;
  [key: string]: unknown;
}

export interface RoutedEpisode {
  id?: string | number;
  [key: string]: unknown;
}

export interface PlayerRoutingHost {
  state: AppState;
  ensurePlayerStage(): void;
  stopPreview(): void;
  resetPlaybackItem(): void;
  prepareItem(item: RoutedItem): void;
  applyPlayerMode(isVod: boolean): void;
  refreshPlayer(): void;
  showPlayerScreen(): void;
  focusPlayer(): void;
  closeChannelPanels(): void;
  showInfobar(): void;
  playLive(): void;
  playVod(item: RoutedItem | null, episode: RoutedEpisode | null): void;
  openFullscreen(item: RoutedItem | null, episode: RoutedEpisode | null): void;
}

let host: PlayerRoutingHost | null = null;

export function attachPlayerRouting(next: PlayerRoutingHost): boolean {
  host = next;
  return true;
}

export function hasPlayerRoutingRuntime(): boolean {
  return host !== null;
}

export function resetPlayerRoutingRuntime(): void {
  host = null;
}

export function openPlayer(
  mode: string,
  item: RoutedItem | null,
  episode: RoutedEpisode | null
): boolean {
  if (!host) {
    return false;
  }
  const state = host.state;
  if (mode === "vod" && state.screen === "detail") {
    host.openFullscreen(item, episode);
    return true;
  }
  host.ensurePlayerStage();
  if (mode === "live") {
    host.stopPreview();
  }
  state.playerMode = mode;
  if (item && state.playerItem !== item) {
    host.resetPlaybackItem();
  }
  state.playerItem = item || null;
  state.playerEpisode = episode || null;
  if (mode === "vod") {
    state.playerSeasonIndex = state.detailSeason || 0;
    if (item) {
      host.prepareItem(item);
    }
  }
  state.playerReturn = {
    screen: state.screen,
    focus: state.focus
  };
  host.closeChannelPanels();
  host.applyPlayerMode(mode === "vod");
  host.refreshPlayer();
  host.showPlayerScreen();
  host.focusPlayer();
  host.refreshPlayer();
  if (mode === "vod") {
    host.showInfobar();
    host.playVod(state.playerItem as RoutedItem | null, state.playerEpisode as RoutedEpisode | null);
  } else {
    host.showInfobar();
    host.playLive();
  }
  return true;
}
