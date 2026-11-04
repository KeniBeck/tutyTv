import type { NavigationState } from "./navigation";
import { showScreen } from "./router";

export interface ActionNode {
  textContent?: string | null;
  classList: {
    add(name: string): void;
    contains(name: string): boolean;
    toggle(name: string, force?: boolean): void;
  };
  querySelector?(selector: string): ActionNode | null;
}

export interface NavigationActionsHost {
  state: NavigationState;
  byId(id: string): ActionNode | null;
  focus(node: ActionNode | null): void;
  canFocus(node: ActionNode | null): boolean;
  getTabs(): ActionNode[];
  getDetailButtons(): ActionNode | null;
  getDetailBottom(): ActionNode | null;
  getSynopsisMore(): ActionNode | null;
  renderDetail(item: unknown): void;
  markDetailPlaying(item: unknown): void;
  getDocument(): Document;
  showScreen(name: string): void;
  selectTab(index: number, focus: boolean): void;
  resetStream(): void;
  resetPlayerSurface(node: ActionNode | null): void;
  resetSubtitles(): void;
  stopWebMedia(): void;
  afterScreenChange(): void;
  hideInfobar(): void;
  hideVodInfobar(): void;
  getPlayerScreen(): ActionNode | null;
  closeNextEpisodePrompt(restoreFocus: boolean): void;
  closeEpisodeBrowser(silent?: boolean): void;
  closeCategoryPicker(silent?: boolean): void;
  closeLiveCategories(silent?: boolean): void;
  closeLiveSearch(silent?: boolean): void;
  isFullSettingsOpen(): boolean;
  isQuickSettingsOpen(): boolean;
  closeFullSettings(): void;
  closeQuickSettings(): void;
}

let host: NavigationActionsHost | null = null;

export function attachNavigationActions(next: NavigationActionsHost): boolean {
  host = next;
  return true;
}

export function resetNavigationActionsRuntime(): void {
  host = null;
}

interface PlayerReturn {
  screen?: string;
  focus?: ActionNode | null;
}

interface DetailReturn {
  screen?: string;
  focus?: ActionNode | null;
}

export function showNavigationScreen(name: string): boolean {
  if (!host) {
    return false;
  }
  const state = host.state;
  showScreen(name, host.getDocument(), state);
  if (name !== "player" && state.nextEpisodeOpen) {
    host.closeNextEpisodePrompt(false);
  }
  if (name !== "player" && state.episodeBrowserOpen) {
    host.closeEpisodeBrowser(true);
  }
  if (name !== "player" && state.categoryPickerOpen) {
    host.closeCategoryPicker(true);
  }
  if (name !== "home" && state.liveCategoriesOpen) {
    host.closeLiveCategories(true);
  }
  if (name !== "home" && state.liveSearchOpen) {
    host.closeLiveSearch(true);
  }
  if (name !== "player" && name !== "detail") {
    if (host.isFullSettingsOpen()) {
      host.closeFullSettings();
    }
    if (host.isQuickSettingsOpen()) {
      host.closeQuickSettings();
    }
    host.resetPlayerSurface(host.getPlayerScreen());
    host.resetStream();
    host.resetSubtitles();
  }
  if (name !== "player" && name !== "detail") {
    host.stopWebMedia();
  }
  host.afterScreenChange();
  return true;
}

export function returnFromPlayer(): boolean {
  if (!host) {
    return false;
  }
  const state = host.state;
  host.hideInfobar();
  host.hideVodInfobar();
  const target = state.playerReturn as PlayerReturn | null;
  if (target && target.screen === "detail") {
    const playerScreen = host.byId("screen-player");
    const detailScreen = host.byId("screen-detail");
    playerScreen?.classList.add("is-mini");
    playerScreen?.classList.add("is-active");
    detailScreen?.classList.add("is-active");
    state.screen = "detail";
    let rebuilt = false;
    if (state.detailNeedsRebuild && state.detail) {
      state.detailNeedsRebuild = false;
      host.renderDetail(state.detail);
      rebuilt = true;
      const season = host.getDetailBottom()?.querySelector?.(".detail-season") || null;
      if (season) {
        host.focus(season);
      }
    } else if (state.detail) {
      host.markDetailPlaying(state.detail);
    }
    if (!rebuilt) {
      const saved = target.focus;
      if (saved && host.canFocus(saved)) {
        host.focus(saved);
      } else {
        const first = host.getDetailButtons()?.querySelector?.(".focusable") || null;
        if (first) {
          host.focus(first);
        }
      }
    }
    return true;
  }
  host.resetStream();
  host.resetPlayerSurface(host.byId("screen-player"));
  if (target && target.screen === "search") {
    host.showScreen("search");
    if (target.focus) {
      host.focus(target.focus);
    }
  } else {
    host.showScreen("home");
    host.selectTab(state.tab, false);
    if (target && target.focus && host.canFocus(target.focus)) {
      host.focus(target.focus);
    } else {
      host.focus(host.getTabs()[state.tab] || null);
    }
  }
  return true;
}

export function returnFromDetail(): boolean {
  if (!host) {
    return false;
  }
  const state = host.state;
  host.resetStream();
  host.resetPlayerSurface(host.byId("screen-player"));
  const target = state.detailReturn as DetailReturn | null;
  if (target && target.screen === "search") {
    host.showScreen("search");
    if (target.focus) {
      host.focus(target.focus);
    }
  } else {
    host.showScreen("home");
    host.selectTab(state.tab, false);
    if (target && target.focus && host.canFocus(target.focus)) {
      host.focus(target.focus);
    } else {
      host.focus(host.getTabs()[state.tab] || null);
    }
  }
  return true;
}

export function toggleDetailSynopsis(): boolean {
  if (!host) {
    return false;
  }
  const detail = host.byId("screen-detail");
  if (!detail) {
    return false;
  }
  const open = !detail.classList.contains("is-synopsis-open");
  detail.classList.toggle("is-synopsis-open", open);
  const more = host.getSynopsisMore();
  if (more) {
    more.textContent = open ? "Menos" : "Más";
  }
  return true;
}

type NavigationActionsDerived =
  | "getDocument"
  | "getSynopsisMore"
  | "getPlayerScreen";

export type NavigationActionsHostDeps = Omit<NavigationActionsHost, NavigationActionsDerived>;

export function createNavigationActionsHost(deps: NavigationActionsHostDeps): NavigationActionsHost {
  return {
    ...deps,
    getDocument: function getDocument() {
      return document;
    },
    getSynopsisMore: function getSynopsisMore() {
      return document.querySelector(".detail-more") as ActionNode | null;
    },
    getPlayerScreen: function getPlayerScreen() {
      return deps.byId("screen-player");
    }
  };
}
