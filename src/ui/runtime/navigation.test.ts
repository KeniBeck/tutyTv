import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppState } from "./state";
import {
  attachNavigation,
  createNavigationHost,
  handleNavigationBack,
  handleNavigationKey,
  resetNavigationRuntime,
  type NavigationHost,
  type NavigationNode,
  type NavigationState
} from "./navigation";

function node(className = ""): NavigationNode {
  const classes = new Set(className.split(" ").filter(Boolean));
  return {
    classList: {
      contains: (name: string) => classes.has(name),
      toggle: (name: string, force?: boolean) => {
        const next = force === undefined ? !classes.has(name) : force;
        if (next) classes.add(name); else classes.delete(name);
      }
    }
  };
}

function createHarness() {
  resetNavigationRuntime();
  const state = createAppState() as NavigationState;
  state.screen = "home";
  state.tab = 1;
  state.channel = 2;
  state.playerMode = "vod";
  const calls: string[] = [];
  const tabs = [node(), node(), node()];
  const seekbar = node();
  let focus: NavigationNode | null = node();
  const flags = { full: false, quick: false, addons: false, seeking: false, videoPaused: false, source: true, synopsis: false };
  const host: NavigationHost = {
    state,
    byId: () => null,
    closest: () => null,
    getFocus: () => focus,
    canFocus: () => true,
    focus: () => calls.push("focus"),
    moveFocus: (direction) => calls.push(`move:${direction}`),
    activateFocus: () => calls.push("activate"),
    getTabs: () => tabs,
    getPlayerFocus: () => null,
    getSeekbar: () => seekbar,
    getChannels: () => [{ name: "A" }, { name: "B" }, { name: "C" }],
    getVideoPaused: () => flags.videoPaused,
    hasVideoSource: () => flags.source,
    isSeeking: () => flags.seeking,
    isFullSettingsOpen: () => flags.full,
    isQuickSettingsOpen: () => flags.quick,
    isAddonsOpen: () => flags.addons,
    hasSeasonPopup: () => false,
    isSynopsisOpen: () => flags.synopsis,
    navigationAction: (event) => {
      if (event.key === "Back") return "back";
      const map: Record<number, string> = { 37: "left", 38: "up", 39: "right", 40: "down", 13: "enter", 457: "menu" };
      return map[Number(event.keyCode || event.which || 0)] || null;
    },
    mapMediaKey: (code) => ({ 415: "play", 19: "pause", 10252: "playpause", 417: "forward", 412: "rewind", 413: "stop", 457: "menu" }[code] || null),
    closeCategoryPicker: () => calls.push("close-category"),
    closeSearch: () => calls.push("close-search"),
    closeLiveSearch: () => calls.push("close-live-search"),
    closeLiveCategories: () => calls.push("close-live-categories"),
    cancelNextEpisodePrompt: () => calls.push("cancel-next"),
    closeEpisodeBrowser: () => calls.push("close-browser"),
    closeAddons: () => calls.push("close-addons"),
    closeResume: () => calls.push("close-resume"),
    closeFilter: () => calls.push("close-filter"),
    closeFullSettings: () => { flags.full = false; calls.push("close-full"); },
    closeQuickSettings: () => { flags.quick = false; calls.push("close-quick"); },
    closeSeek: () => calls.push("close-seek"),
    closeChannels: () => calls.push("close-channels"),
    closeSeasonPopup: () => calls.push("close-season"),
    scheduleInfobarHide: () => calls.push("schedule-infobar"),
    schedulePlaySettingsClose: () => calls.push("schedule-settings"),
    hideInfobar: () => calls.push("hide-infobar"),
    hideVodInfobar: () => calls.push("hide-vod-infobar"),
    openCategories: () => calls.push("open-categories"),
    openQuickSettings: () => { flags.quick = true; calls.push("open-quick"); },
    openFullSettings: () => calls.push("open-full"),
    openChannels: () => calls.push("open-channels"),
    showScreen: (name) => calls.push(`screen:${name}`),
    selectTab: (index, focusTab) => calls.push(`tab:${index}:${focusTab}`),
    platformBack: () => calls.push("platform-back"),
    returnFromPlayer: () => calls.push("return-player"),
    returnFromDetail: () => calls.push("return-detail"),
    toggleSynopsis: () => calls.push("toggle-synopsis"),
    handleBrowserHorizontal: (code) => code === 39,
    handleBrowserFocus: () => calls.push("browser-focus"),
    resetStream: () => calls.push("reset-stream"),
    resetPlayerSurface: () => calls.push("reset-surface"),
    stopWebMedia: () => calls.push("stop-web"),
    playVideo: () => { flags.videoPaused = false; calls.push("play-video"); },
    pauseVideo: () => { flags.videoPaused = true; calls.push("pause-video"); },
    togglePlayPause: () => calls.push("toggle-play"),
    playCurrent: () => calls.push("play-current"),
    setPlaybackStatus: (action) => calls.push(`status:${action}`),
    showInfobar: () => calls.push("show-infobar"),
    vodSeek: (delta) => calls.push(`vod-seek:${delta}`),
    stepSeek: (delta) => calls.push(`step-seek:${delta}`),
    startSeek: () => calls.push("start-seek"),
    endSeek: () => { flags.seeking = false; calls.push("end-seek"); },
    notifyStatus: (message) => calls.push(`notify:${message}`),
    selectLiveChannel: (index, force) => calls.push(`select-live:${index}:${force}`),
    focusLiveChannelRow: (index) => calls.push(`focus-live:${index}`)
  };
  attachNavigation(host);
  return { host, state, calls, tabs, flags, seekbar, setFocus(value: NavigationNode | null) { focus = value; } };
}

afterEach(() => {
  resetNavigationRuntime();
  vi.useRealTimers();
});

describe("navigation", () => {
  it("handles back through full settings, player overlays, home tabs and detail", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const back = () => {
      vi.advanceTimersByTime(300);
      return handleNavigationBack();
    };
    const harness = createHarness();
    harness.flags.full = true;
    expect(back()).toBe(true);
    expect(harness.calls).toContain("close-full");

    const throttled = createHarness();
    throttled.flags.full = true;
    back();
    back();
    expect(throttled.calls.filter((call) => call === "close-full")).toHaveLength(1);

    const player = createHarness();
    player.state.screen = "player";
    player.state.categoryPickerOpen = true;
    back();
    expect(player.calls).toContain("close-category");
    player.state.categoryPickerOpen = false;
    player.state.episodeBrowserOpen = true;
    back();
    expect(player.calls).toContain("close-browser");
    player.state.episodeBrowserOpen = false;
    player.flags.quick = true;
    back();
    expect(player.calls).toContain("close-quick");
    player.state.channelsOpen = true;
    back();
    expect(player.calls).toContain("close-channels");
    player.state.channelsOpen = false;
    player.state.infobar = true;
    back();
    expect(player.calls).toContain("hide-infobar");
    player.state.infobar = false;
    player.state.vodInfobarVisible = true;
    back();
    expect(player.calls).toContain("hide-vod-infobar");
    player.state.vodInfobarVisible = false;
    back();
    expect(player.calls).toContain("return-player");

    const home = createHarness();
    home.state.screen = "home";
    home.state.tab = 1;
    back();
    expect(home.calls).toEqual(expect.arrayContaining(["tab:0:true", "focus"]));
    home.state.tab = 0;
    back();
    expect(home.calls.filter((call) => call === "focus").length).toBeGreaterThanOrEqual(2);
    home.state.focus = {
      ...node(),
      closest: (selector: string) => selector === ".home-tabs" ? node() : null
    } as unknown as never;
    back();
    expect(home.calls).toContain("platform-back");

    const detail = createHarness();
    detail.state.screen = "detail";
    back();
    expect(detail.calls).toEqual(expect.arrayContaining(["return-detail"]));
    expect(detail.calls).not.toContain("toggle-synopsis");

    const synopsis = createHarness();
    synopsis.state.screen = "detail";
    synopsis.flags.synopsis = true;
    back();
    expect(synopsis.calls).toEqual(expect.arrayContaining(["toggle-synopsis"]));
    expect(synopsis.calls).not.toContain("return-detail");
  });

  it("routes key directions, enter, back overlays and media buttons", () => {
    const harness = createHarness();
    const event = { keyCode: 38, preventDefault: vi.fn(), stopPropagation: vi.fn() };
    expect(handleNavigationKey(event)).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(harness.calls).toContain("move:up");
    handleNavigationKey({ keyCode: 13, preventDefault: vi.fn() });
    expect(harness.calls).toContain("activate");

    harness.state.categoryPickerOpen = true;
    const back = { key: "Back", preventDefault: vi.fn(), stopPropagation: vi.fn() };
    expect(handleNavigationKey(back)).toBe(true);
    expect(harness.calls).toContain("close-category");
    expect(back.stopPropagation).toHaveBeenCalled();
    harness.state.categoryPickerOpen = false;

    harness.state.screen = "player";
    harness.flags.videoPaused = true;
    handleNavigationKey({ keyCode: 415, preventDefault: vi.fn() });
    expect(harness.calls).toContain("play-video");
    harness.flags.videoPaused = false;
    handleNavigationKey({ keyCode: 19, preventDefault: vi.fn() });
    expect(harness.calls).toContain("pause-video");
    handleNavigationKey({ keyCode: 417, preventDefault: vi.fn() });
    expect(harness.calls).toContain("vod-seek:15");
    handleNavigationKey({ keyCode: 412, preventDefault: vi.fn() });
    expect(harness.calls).toContain("vod-seek:-15");
    handleNavigationKey({ keyCode: 40, preventDefault: vi.fn() });
    expect(harness.calls).toContain("open-quick");
  });

  it("routes VOD seek and live channel navigation", () => {
    const harness = createHarness();
    harness.state.screen = "player";
    harness.state.playerMode = "vod";
    harness.setFocus(harness.seekbar);
    harness.flags.seeking = true;
    handleNavigationKey({ keyCode: 37, preventDefault: vi.fn() });
    expect(harness.calls).toContain("step-seek:-1");
    handleNavigationKey({ keyCode: 38, preventDefault: vi.fn() });
    expect(harness.calls).toContain("end-seek");
    harness.flags.seeking = false;
    handleNavigationKey({ keyCode: 39, preventDefault: vi.fn() });
    expect(harness.calls).toContain("vod-seek:10");

    harness.state.playerMode = "live";
    harness.state.channel = 1;
    handleNavigationKey({ keyCode: 38, preventDefault: vi.fn() });
    expect(harness.calls).toContain("select-live:0:false");
    handleNavigationKey({ keyCode: 40, preventDefault: vi.fn() });
    expect(harness.calls).toContain("select-live:2:false");
    handleNavigationKey({ keyCode: 37, preventDefault: vi.fn() });
    expect(harness.calls).toContain("open-channels");
  });

  it("routes episode browser, menu and enter playback", () => {
    const harness = createHarness();
    harness.state.episodeBrowserOpen = true;
    handleNavigationKey({ keyCode: 13, preventDefault: vi.fn() });
    expect(harness.calls).toContain("activate");
    handleNavigationKey({ keyCode: 38, preventDefault: vi.fn() });
    expect(harness.calls).toContain("move:up");
    harness.state.episodeBrowserOpen = false;

    harness.state.screen = "home";
    harness.state.tab = 0;
    handleNavigationKey({ keyCode: 457, preventDefault: vi.fn() });
    expect(harness.calls).toContain("open-categories");

    harness.state.screen = "player";
    harness.state.playerMode = "vod";
    harness.state.streamError = "error";
    harness.setFocus(node());
    handleNavigationKey({ keyCode: 13, preventDefault: vi.fn() });
    expect(harness.calls).toContain("play-current");
  });

  it("lets the back key reach the back handler when no overlay is open", () => {
    const harness = createHarness();
    harness.state.screen = "home";
    harness.state.tab = 0;
    harness.state.focus = {
      ...node(),
      closest: (selector: string) => selector === ".home-tabs" ? node() : null
    } as unknown as never;
    const event = { key: "Back", preventDefault: vi.fn(), stopPropagation: vi.fn() };
    expect(handleNavigationKey(event)).toBe(true);
    expect(harness.calls).toContain("platform-back");
    expect(event.preventDefault).toHaveBeenCalled();
  });
});
describe("navigation host factory", () => {
  it("derives focus, video, synopsis, seek and browser helpers", () => {
    const harness = createHarness();
    const base = harness.host;
    const focused = node() as NavigationNode & { _activate?: () => void };
    const detail = node("is-synopsis-open");
    let activated = 0;
    focused._activate = () => { activated += 1; };
    harness.setFocus(focused);
    let seekClosed = 0;
    const created = createNavigationHost({
      state: { ...base.state, focus: focused as never },
      byId: (id) => (id === "screen-detail" ? detail : null),
      closest: base.closest,
      canFocus: base.canFocus,
      focus: base.focus,
      moveFocus: base.moveFocus,
      getTabs: base.getTabs,
      getPlayerFocus: base.getPlayerFocus,
      getSeekbar: base.getSeekbar,
      getChannels: base.getChannels,
      getVideo: () => ({ paused: true, src: "" }),
      isSeeking: base.isSeeking,
      isFullSettingsOpen: base.isFullSettingsOpen,
      isQuickSettingsOpen: base.isQuickSettingsOpen,
      isAddonsOpen: base.isAddonsOpen,
      hasSeasonPopup: base.hasSeasonPopup,
      navigationAction: base.navigationAction,
      mapMediaKey: base.mapMediaKey,
      closeCategoryPicker: base.closeCategoryPicker,
      closeSearch: base.closeSearch,
      closeLiveSearch: base.closeLiveSearch,
      closeLiveCategories: base.closeLiveCategories,
      cancelNextEpisodePrompt: base.cancelNextEpisodePrompt,
      closeEpisodeBrowser: base.closeEpisodeBrowser,
      closeAddons: base.closeAddons,
      closeResume: base.closeResume,
      closeFilter: base.closeFilter,
      closeFullSettings: base.closeFullSettings,
      closeQuickSettings: base.closeQuickSettings,
      closeChannels: base.closeChannels,
      closeSeasonPopup: base.closeSeasonPopup,
      scheduleInfobarHide: base.scheduleInfobarHide,
      schedulePlaySettingsClose: base.schedulePlaySettingsClose,
      hideInfobar: base.hideInfobar,
      hideVodInfobar: base.hideVodInfobar,
      openCategories: base.openCategories,
      openQuickSettings: base.openQuickSettings,
      openFullSettings: base.openFullSettings,
      openChannels: base.openChannels,
      showScreen: base.showScreen,
      selectTab: base.selectTab,
      platformBack: base.platformBack,
      returnFromPlayer: base.returnFromPlayer,
      returnFromDetail: base.returnFromDetail,
      toggleSynopsis: base.toggleSynopsis,
      handleBrowserHorizontal: base.handleBrowserHorizontal,
      resetStream: base.resetStream,
      resetPlayerSurface: base.resetPlayerSurface,
      stopWebMedia: base.stopWebMedia,
      playVideo: base.playVideo,
      pauseVideo: base.pauseVideo,
      togglePlayPause: base.togglePlayPause,
      playCurrent: base.playCurrent,
      setPlaybackStatus: base.setPlaybackStatus,
      showInfobar: base.showInfobar,
      vodSeek: base.vodSeek,
      stepSeek: base.stepSeek,
      startSeek: base.startSeek,
      closeSeek: () => { seekClosed += 1; },
      notifyStatus: base.notifyStatus,
      selectLiveChannel: base.selectLiveChannel,
      focusLiveChannelRow: base.focusLiveChannelRow
    });
    expect(created.getFocus()).toBe(focused);
    created.activateFocus();
    expect(activated).toBe(1);
    expect(created.getVideoPaused()).toBe(true);
    expect(created.hasVideoSource()).toBe(false);
    expect(created.isSynopsisOpen()).toBe(true);
    expect(created.handleBrowserFocus(39)).toBe(true);
    created.closeSeek();
    created.endSeek();
    expect(seekClosed).toBe(2);
  });
});
