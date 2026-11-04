import type { AppState } from "./state";

export interface NavigationNode {
  classList: {
    contains(name: string): boolean;
    toggle(name: string, force?: boolean): void;
  };
  _channel?: number;
  querySelector?(selector: string): NavigationNode | null;
}

export interface NavigationChannel {
  [key: string]: unknown;
}

export interface NavigationState extends AppState {
  vodInfobarVisible?: boolean;
}

export interface NavigationEvent {
  keyCode?: number;
  which?: number;
  key?: string;
  preventDefault?: () => void;
  stopPropagation?: () => void;
}

export interface NavigationHost {
  state: NavigationState;
  byId(id: string): NavigationNode | null;
  closest(node: NavigationNode, selector: string): NavigationNode | null;
  getFocus(): NavigationNode | null;
  canFocus(node: NavigationNode | null): boolean;
  focus(node: NavigationNode | null): void;
  moveFocus(direction: string): void;
  activateFocus(): void;
  getTabs(): NavigationNode[];
  getPlayerFocus(): NavigationNode | null;
  getSeekbar(): NavigationNode | null;
  getChannels(): NavigationChannel[];
  getVideoPaused(): boolean;
  hasVideoSource(): boolean;
  isSeeking(): boolean;
  isFullSettingsOpen(): boolean;
  isQuickSettingsOpen(): boolean;
  isAddonsOpen(): boolean;
  hasSeasonPopup(): boolean;
  isSynopsisOpen(): boolean;
  navigationAction(event: NavigationEvent): string | null;
  mapMediaKey(code: number, key: string): string | null;
  closeCategoryPicker(): void;
  closeSearch(): void;
  closeLiveSearch(): void;
  closeLiveCategories(): void;
  cancelNextEpisodePrompt(): void;
  closeEpisodeBrowser(): void;
  closeAddons(): void;
  closeResume(): void;
  closeFilter(): void;
  closeFullSettings(): void;
  closeQuickSettings(): void;
  closeSeek(): void;
  closeChannels(): void;
  closeSeasonPopup(): void;
  schedulePlaySettingsClose(): void;
  hideInfobar(): void;
  hideVodInfobar(): void;
  openCategories(): void;
  openQuickSettings(): void;
  openFullSettings(): void;
  openChannels(): void;
  showScreen(name: string): void;
  selectTab(index: number, focus: boolean): void;
  platformBack(): void;
  returnFromPlayer(): void;
  returnFromDetail(): void;
  toggleSynopsis(): void;
  handleBrowserHorizontal(code: number): boolean;
  handleBrowserFocus(code: number): void;
  resetStream(): void;
  resetPlayerSurface(): void;
  stopWebMedia(): void;
  playVideo(): void;
  pauseVideo(): void;
  togglePlayPause(): void;
  playCurrent(): void;
  setPlaybackStatus(action: string): void;
  showInfobar(): void;
  scheduleInfobarHide(): void;
  vodSeek(delta: number): void;
  stepSeek(delta: number): void;
  startSeek(): void;
  endSeek(): void;
  notifyStatus(message: string): void;
  selectLiveChannel(index: number, force: boolean): void;
  focusLiveChannelRow(index: number): void;
}

let host: NavigationHost | null = null;
let lastBackAt = 0;

export function attachNavigation(next: NavigationHost): boolean {
  host = next;
  return true;
}

export function resetNavigationRuntime(): void {
  host = null;
  lastBackAt = 0;
}

export function handleNavigationBack(): boolean {
  if (!host) {
    return false;
  }
  const now = Date.now();
  if (now - lastBackAt < 250) {
    return true;
  }
  lastBackAt = now;
  const state = host.state;
  if (host.isFullSettingsOpen()) {
    host.closeFullSettings();
    return true;
  }
  if (state.screen === "player") {
    if (host.isSeeking()) {
      host.endSeek();
      return true;
    }
    if (state.categoryPickerOpen) {
      host.closeCategoryPicker();
      return true;
    }
    if (state.episodeBrowserOpen) {
      host.closeEpisodeBrowser();
      return true;
    }
    if (host.isQuickSettingsOpen()) {
      host.closeQuickSettings();
      return true;
    }
    if (state.channelsOpen) {
      host.closeChannels();
      return true;
    }
    if (state.infobar) {
      host.hideInfobar();
      return true;
    }
    if (state.vodInfobarVisible) {
      host.hideVodInfobar();
      return true;
    }
    host.returnFromPlayer();
    return true;
  }
  if (state.screen !== "detail") {
    if (state.screen === "search") {
      host.closeSearch();
      host.showScreen("home");
      host.selectTab(state.tab, false);
      host.focus(host.getTabs()[state.tab] || null);
      return true;
    }
    if (state.screen === "settings") {
      host.showScreen("home");
      host.selectTab(state.tab, false);
      host.focus(host.getTabs()[state.tab] || null);
      return true;
    }
    if (state.screen === "home") {
      if (state.tab !== 0) {
        host.selectTab(0, true);
        host.focus(host.getTabs()[0] || null);
        return true;
      }
      const focused = state.focus;
      const inTabs = Boolean(focused && focused.closest && focused.closest(".home-tabs"));
      if (!inTabs) {
        const tab = host.getTabs()[0] || null;
        if (tab) {
          host.focus(tab);
          return true;
        }
      }
      host.platformBack();
      return true;
    }
    return true;
  }
  if (host.hasSeasonPopup()) {
    host.closeSeasonPopup();
    return true;
  }
  if (host.isSynopsisOpen()) {
    host.toggleSynopsis();
    return true;
  }
  host.returnFromDetail();
  return true;
}

export function handleNavigationKey(event: NavigationEvent): boolean {
  if (!host) {
    return false;
  }
  const state = host.state;
  const code = Number(event.keyCode || event.which || 0);
  const key = event.key || "";
  const action = host.navigationAction(event);
  let handled = true;

  if (action === "back") {
    if (state.categoryPickerOpen) {
      host.closeCategoryPicker();
    } else if (state.liveSearchOpen) {
      host.closeLiveSearch();
    } else if (state.liveCategoriesOpen) {
      host.closeLiveCategories();
    } else if (state.nextEpisodeOpen) {
      host.cancelNextEpisodePrompt();
    } else if (state.episodeBrowserOpen) {
      host.closeEpisodeBrowser();
    } else if (host.isAddonsOpen()) {
      host.closeAddons();
    } else if (state.resumeOpen) {
      host.closeResume();
    } else if (state.filterOpen) {
      host.closeFilter();
    } else if (host.isFullSettingsOpen()) {
      host.closeFullSettings();
    } else if (host.isQuickSettingsOpen()) {
      host.closeQuickSettings();
    } else {
      handleNavigationBack();
    }
    return consume(event, true);
  }

  if (state.resumeOpen || state.filterOpen || state.categoryPickerOpen || state.liveSearchOpen || state.liveCategoriesOpen || state.nextEpisodeOpen) {
    if (moveByCode(host, code)) {
      return consume(event);
    }
    if (code === 13 || code === 32) {
      host.activateFocus();
      return consume(event);
    }
    return false;
  }

  if (state.episodeBrowserOpen) {
    if (host.handleBrowserHorizontal(code)) {
      return consume(event);
    }
    if (code === 38 || code === 40) {
      host.moveFocus(code === 38 ? "up" : "down");
    } else if (code === 13 || code === 32) {
      host.activateFocus();
    } else if (code === 37 || code === 39) {
      host.handleBrowserFocus(code);
    } else {
      handled = false;
    }
    return handled ? consume(event) : false;
  }

  const mediaAction = host.mapMediaKey(code, key);
  if (state.screen === "player") {
    if (mediaAction === "play") {
      if (host.hasVideoSource() && host.getVideoPaused()) {
        host.playVideo();
        host.setPlaybackStatus("none");
        host.showInfobar();
      }
      return consume(event);
    }
    if (mediaAction === "pause") {
      if (host.hasVideoSource() && !host.getVideoPaused()) {
        host.pauseVideo();
        host.setPlaybackStatus("pause");
        host.showInfobar();
      }
      return consume(event);
    }
    if (mediaAction === "playpause") {
      host.togglePlayPause();
      return consume(event);
    }
    if (mediaAction === "forward") {
      host.vodSeek(15);
      return consume(event);
    }
    if (mediaAction === "rewind") {
      host.vodSeek(-15);
      return consume(event);
    }
    if (mediaAction === "stop") {
      handleNavigationBack();
      return consume(event);
    }
  }

  if (state.screen === "player" && state.playerMode === "vod" && mediaAction === "menu") {
    if (host.isFullSettingsOpen()) {
      host.closeFullSettings();
    } else if (host.isQuickSettingsOpen()) {
      host.closeQuickSettings();
    } else {
      host.openQuickSettings();
    }
    return consume(event);
  }
  if (state.screen === "home" && state.tab === 0 && mediaAction === "menu" && !state.liveCategoriesOpen && !state.liveSearchOpen) {
    host.openCategories();
    return consume(event);
  }

  if (state.screen === "player" && (code === 37 || code === 38 || code === 39 || code === 40)) {
    if (host.isFullSettingsOpen() || host.isQuickSettingsOpen()) {
      if (host.isQuickSettingsOpen()) {
        host.schedulePlaySettingsClose();
      }
      moveByCode(host, code);
      return consume(event);
    }
    const focus = host.getFocus();
    const seekbar = host.getSeekbar();
    if (state.playerMode === "vod") {
      if (focus && focus === seekbar && host.isSeeking()) {
        if (code === 37) {
          host.stepSeek(-1);
          return consume(event);
        }
        if (code === 39) {
          host.stepSeek(1);
          return consume(event);
        }
        if (code === 38 || code === 40) {
          host.endSeek();
          return consume(event);
        }
      }
      if (code === 37) {
        host.vodSeek(-10);
        return consume(event);
      }
      if (code === 39) {
        host.vodSeek(10);
        return consume(event);
      }
      if (code === 40) {
        host.openQuickSettings();
        return consume(event);
      }
      if (code === 38) {
        host.startSeek();
        return consume(event);
      }
    } else {
      const channelsPanel = focus ? host.closest(focus, ".player-channels") : null;
      if (state.channelsOpen || channelsPanel) {
        if (focus?.classList.contains("pc-cat-pill")) {
          moveByCode(host, code);
          return consume(event);
        }
        const rowIndex = focus && focus._channel !== undefined ? focus._channel : state.channel;
        if (code === 38) {
          if (rowIndex === 0) {
            const panel = host.byId("player-channels");
            const pill = panel?.querySelector?.(".pc-cat-pill.is-selected") || panel?.querySelector?.(".pc-cat-pill");
            if (pill) {
              host.focus(pill as NavigationNode);
            }
          } else {
            host.focusLiveChannelRow(rowIndex - 1);
          }
          return consume(event);
        }
        if (code === 40) {
          host.focusLiveChannelRow(Math.min(host.getChannels().length - 1, rowIndex + 1));
          return consume(event);
        }
        if (code === 39) {
          host.closeChannels();
          return consume(event);
        }
        if (code === 37) {
          host.moveFocus("left");
          return consume(event);
        }
        return consume(event);
      }
      if (code === 38) {
        if (state.channel > 0) {
          host.selectLiveChannel(state.channel - 1, false);
        } else if (host.getChannels().length) {
          host.selectLiveChannel(host.getChannels().length - 1, false);
        }
        host.showInfobar();
        return consume(event);
      }
      if (code === 40) {
        if (state.channel < host.getChannels().length - 1) {
          host.selectLiveChannel(state.channel + 1, false);
        } else if (host.getChannels().length) {
          host.selectLiveChannel(0, false);
        }
        host.showInfobar();
        return consume(event);
      }
      if (code === 37) {
        host.openChannels();
        return consume(event);
      }
      host.scheduleInfobarHide();
      return consume(event);
    }
  }

  if (action === "left" || action === "up" || action === "right" || action === "down") {
    host.moveFocus(action);
  } else if (action === "enter") {
    if (state.episodeBrowserOpen) {
      host.activateFocus();
    } else if (host.isFullSettingsOpen()) {
      host.activateFocus();
    } else if (host.isQuickSettingsOpen()) {
      host.schedulePlaySettingsClose();
      host.activateFocus();
    } else if (state.screen === "player" && state.playerMode === "vod" && host.getFocus() === host.getSeekbar() && host.isSeeking()) {
      host.endSeek();
    } else if (state.screen === "player" && state.streamError && host.hasVideoSource()) {
      const focus = host.getFocus();
      if (!focus || !host.closest(focus, ".player-channels")) {
        host.playCurrent();
        state.streamError = "";
        host.notifyStatus("");
        return consume(event);
      }
      host.togglePlayPause();
    } else if (state.screen === "player" && state.playerMode === "vod") {
      host.togglePlayPause();
    } else {
      host.activateFocus();
    }
  } else {
    handled = false;
  }
  return handled ? consume(event) : false;
}

function moveByCode(target: NavigationHost, code: number): boolean {
  if (code === 37) {
    target.moveFocus("left");
    return true;
  }
  if (code === 38) {
    target.moveFocus("up");
    return true;
  }
  if (code === 39) {
    target.moveFocus("right");
    return true;
  }
  if (code === 40) {
    target.moveFocus("down");
    return true;
  }
  return false;
}

function consume(event: NavigationEvent, stop = false): boolean {
  event.preventDefault?.();
  if (stop) {
    event.stopPropagation?.();
  }
  return true;
}

type NavigationDerived =
  | "getFocus"
  | "activateFocus"
  | "getVideoPaused"
  | "hasVideoSource"
  | "isSynopsisOpen"
  | "closeSeek"
  | "endSeek"
  | "handleBrowserFocus";

export type NavigationHostDeps = Omit<NavigationHost, NavigationDerived> & {
  getVideo(): { paused?: boolean; src?: string } | null;
  closeSeek(): void;
};

export function createNavigationHost(deps: NavigationHostDeps): NavigationHost {
  const host: NavigationHost = {
    ...deps,
    getFocus: function getFocus() {
      return deps.state.focus as NavigationNode | null;
    },
    activateFocus: function activateFocus() {
      const focused = deps.state.focus as { _activate?: () => void } | null;
      if (focused && focused._activate) {
        focused._activate();
      }
    },
    getVideoPaused: function getVideoPaused() {
      const video = deps.getVideo();
      return !!(video && video.paused);
    },
    hasVideoSource: function hasVideoSource() {
      const video = deps.getVideo();
      return !!(video && video.src);
    },
    isSynopsisOpen: function isSynopsisOpen() {
      const detail = deps.byId("screen-detail");
      return !!(detail && detail.classList.contains("is-synopsis-open"));
    },
    closeSeek: deps.closeSeek,
    endSeek: deps.closeSeek,
    handleBrowserFocus: function handleBrowserFocus(code: number) {
      return deps.handleBrowserHorizontal(code);
    }
  };
  return host;
}
