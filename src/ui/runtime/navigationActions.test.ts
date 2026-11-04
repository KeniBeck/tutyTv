import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppState } from "./state";
import {
  attachNavigationActions,
  resetNavigationActionsRuntime,
  returnFromDetail,
  returnFromPlayer,
  showNavigationScreen,
  toggleDetailSynopsis,
  type ActionNode,
  type NavigationActionsHost
} from "./navigationActions";

function node(classes: string[] = []): ActionNode {
  const set = new Set(classes);
  return {
    textContent: "",
    classList: {
      add: (name) => { set.add(name); },
      contains: (name) => set.has(name),
      toggle: (name, force) => {
        const next = force === undefined ? !set.has(name) : force;
        if (next) set.add(name); else set.delete(name);
      }
    },
    querySelector: (selector) => selector === ".detail-season" ? season : selector === ".focusable" ? first : null
  };
}

let season: ActionNode | null = null;
let first: ActionNode | null = null;

function setup(screen = "player") {
  const state = createAppState();
  state.screen = screen;
  state.tab = 2;
  state.playerReturn = { screen: "detail", focus: null };
  state.detailReturn = { screen: "search", focus: null };
  const nodes: Record<string, ActionNode> = {
    "screen-player": node(),
    "screen-detail": node()
  };
  season = node();
  first = node();
  const synopsisMore = vi.fn<() => ActionNode | null>(() => null);
  const host = {
    state,
    byId: (id: string) => nodes[id] || null,
    focus: vi.fn(),
    canFocus: () => true,
    getTabs: () => [node(), node(), node()],
    getDetailButtons: () => ({ querySelector: () => first }),
    getDetailBottom: () => ({ querySelector: () => season }),
    getSynopsisMore: synopsisMore,
    renderDetail: vi.fn(),
    markDetailPlaying: vi.fn(),
    getDocument: () => ({ querySelectorAll: () => [], getElementById: () => null }) as unknown as Document,
    showScreen: vi.fn(),
    selectTab: vi.fn(),
    resetStream: vi.fn(),
    resetPlayerSurface: vi.fn(),
    resetSubtitles: vi.fn(),
    stopWebMedia: vi.fn(),
    afterScreenChange: vi.fn(),
    hideInfobar: vi.fn(),
    hideVodInfobar: vi.fn(),
    getPlayerScreen: () => nodes["screen-player"] || null,
    closeNextEpisodePrompt: vi.fn(),
    closeEpisodeBrowser: vi.fn(),
    closeCategoryPicker: vi.fn(),
    closeLiveCategories: vi.fn(),
    closeLiveSearch: vi.fn(),
    isFullSettingsOpen: () => false,
    isQuickSettingsOpen: () => false,
    closeFullSettings: vi.fn(),
    closeQuickSettings: vi.fn()
  };
  attachNavigationActions(host as unknown as NavigationActionsHost);
  return { state, nodes, host, synopsisMore };
}

describe("navigation actions", () => {
  afterEach(() => resetNavigationActionsRuntime());

  it("returns to detail and rebuilds the detail when needed", () => {
    const { state, nodes, host } = setup();
    state.detail = { id: "item" };
    state.detailNeedsRebuild = true;

    expect(returnFromPlayer()).toBe(true);
    expect(state.screen).toBe("detail");
    expect(state.detailNeedsRebuild).toBe(false);
    expect(nodes["screen-player"]?.classList.contains("is-mini")).toBe(true);
    expect(host.renderDetail).toHaveBeenCalledWith(state.detail);
    expect(host.focus).toHaveBeenCalledWith(season);
  });

  it("returns to home and focuses the selected tab", () => {
    const { state, host } = setup();
    state.playerReturn = { screen: "home", focus: null };

    expect(returnFromPlayer()).toBe(true);
    expect(host.resetStream).toHaveBeenCalled();
    expect(host.showScreen).toHaveBeenCalledWith("home");
    expect(host.selectTab).toHaveBeenCalledWith(2, false);
    expect(host.focus).toHaveBeenCalledWith(expect.anything());
  });

  it("returns detail to search and restores search focus", () => {
    const { host } = setup("detail");
    const focus = node();
    host.state.detailReturn = { screen: "search", focus: focus as never };

    expect(returnFromDetail()).toBe(true);
    expect(host.showScreen).toHaveBeenCalledWith("search");
    expect(host.focus).toHaveBeenCalledWith(focus);
  });

  it("toggles the synopsis label", () => {
    const { nodes, synopsisMore } = setup("detail");
    const more = node();
    more.textContent = "Más";
    synopsisMore.mockReturnValue(more);

    expect(toggleDetailSynopsis()).toBe(true);
    expect(nodes["screen-detail"]?.classList.contains("is-synopsis-open")).toBe(true);
    expect(more.textContent).toBe("Menos");
    expect(toggleDetailSynopsis()).toBe(true);
    expect(more.textContent).toBe("Más");
  });
  it("switches screens and clears overlays outside player/detail", () => {
    const { state, host } = setup("player");
    state.nextEpisodeOpen = true;
    state.episodeBrowserOpen = true;
    state.categoryPickerOpen = true;
    state.liveCategoriesOpen = true;
    state.liveSearchOpen = true;

    expect(showNavigationScreen("search")).toBe(true);
    expect(host.state.screen).toBe("search");
    expect(host.closeNextEpisodePrompt).toHaveBeenCalledWith(false);
    expect(host.closeEpisodeBrowser).toHaveBeenCalledWith(true);
    expect(host.closeCategoryPicker).toHaveBeenCalledWith(true);
    expect(host.closeLiveCategories).toHaveBeenCalledWith(true);
    expect(host.closeLiveSearch).toHaveBeenCalledWith(true);
    expect(host.resetStream).toHaveBeenCalled();
    expect(host.resetSubtitles).toHaveBeenCalled();
    expect(host.resetPlayerSurface).toHaveBeenCalled();
    expect(host.stopWebMedia).toHaveBeenCalled();
    expect(host.afterScreenChange).toHaveBeenCalled();
  });

});
