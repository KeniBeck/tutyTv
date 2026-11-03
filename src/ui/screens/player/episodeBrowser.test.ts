import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppState } from "../../runtime/state";
import {
  attachEpisodeBrowser,
  closeEpisodeBrowser,
  openEpisodeBrowser,
  playBrowserEpisode,
  playEpisodeSelection,
  resetEpisodeBrowserRuntime,
  selectBrowserSeason,
  type BrowserEpisode,
  type BrowserItem,
  type BrowserNode,
  type BrowserSeason,
  type EpisodeBrowserHost
} from "./episodeBrowser";

class TestNode implements BrowserNode {
  textContent = "";
  style = { display: "" };
  children: TestNode[] = [];
  classes = new Set<string>();
  _onFocus: (() => void) | null = null;
  _activate: (() => void) | null = null;
  classList = {
    add: (name: string) => {
      this.classes.add(name);
    },
    remove: (name: string) => {
      this.classes.delete(name);
    },
    toggle: (name: string, force?: boolean) => {
      const next = force === undefined ? !this.classes.has(name) : force;
      if (next) {
        this.classes.add(name);
      } else {
        this.classes.delete(name);
      }
    }
  };

  constructor(className = "", text = "") {
    className.split(/\s+/).filter(Boolean).forEach((name) => this.classes.add(name));
    this.textContent = text;
  }

  appendChild(node: BrowserNode): void {
    this.children.push(node as TestNode);
  }

  walk(): TestNode[] {
    return [this, ...this.children.flatMap((child) => child.walk())];
  }
}

function findBySelector(root: BrowserNode, selector: string): TestNode[] {
  const classes = selector.split(".").filter(Boolean);
  return (root as TestNode).walk().filter((node) => classes.every((name) => node.classes.has(name)));
}

function createHarness() {
  const state = createAppState();
  state.screen = "player";
  state.playerMode = "vod";
  const episode1: BrowserEpisode = { id: "e1", number: 1, duration: "45 min", quality: "HD" };
  const episode2: BrowserEpisode = { id: "e2", number: 2, duration: "40 min" };
  const item: BrowserItem = {
    id: "series",
    title: "Serie",
    seasonId: "s1",
    episodes: [episode1, episode2],
    _detailsLoaded: true
  };
  const seasons: BrowserSeason[] = [
    { id: "s1", number: 1, _episodes: [episode1, episode2] },
    { id: "s2", number: 2, _episodes: [{ id: "e3", number: 1 }] }
  ];
  item.seasons = seasons;
  state.playerItem = item;
  state.playerEpisode = episode2;
  state.playerSeasonIndex = 0;
  state.detailSeason = 0;

  const overlay = new TestNode("player-episodes");
  const title = new TestNode("pe-title");
  const subtitle = new TestNode("pe-sub");
  const seasonLabel = new TestNode("pe-season-label");
  const seasonsContainer = new TestNode("pe-seasons");
  const episodesContainer = new TestNode("pe-episodes");
  const focus = vi.fn();
  const notify = vi.fn();
  const hideInfobar = vi.fn();
  const closePlaySettingsIfOpen = vi.fn();
  const focusPlayer = vi.fn();
  const playEpisode = vi.fn();
  let pendingSeason: ((episodes: BrowserEpisode[], detail: unknown) => void) | null = null;
  let pendingDetail: (() => void) | null = null;

  const host: EpisodeBrowserHost = {
    state,
    isSeries: () => true,
    ensureDom: () => overlay,
    getOverlay: () => overlay,
    getTitle: () => title,
    getSubtitle: () => subtitle,
    getSeasonLabel: () => seasonLabel,
    getSeasonsContainer: () => seasonsContainer,
    getEpisodesContainer: () => episodesContainer,
    el: (tag, className, text) => new TestNode(className || "", text || ""),
    clear: (node) => {
      (node as TestNode).children = [];
    },
    focus,
    firstFocus: (node) => findBySelector(node, ".focusable")[0] || null,
    querySelector: (node, selector) => findBySelector(node, selector)[0] || null,
    querySelectorAll: (node, selector) => findBySelector(node, selector),
    getSeasons: () => seasons,
    loadSeasonEpisodes: (_item, _season, done) => {
      pendingSeason = done;
    },
    formatEpisode: (_item, episode) => `Episodio ${episode.number || "?"}`,
    formatDuration: (episode) => String(episode.duration || ""),
    loadDetail: (_item, done) => {
      pendingDetail = done;
    },
    notify,
    hideInfobar,
    closePlaySettingsIfOpen,
    focusPlayer,
    playEpisode
  };
  attachEpisodeBrowser(host);
  return {
    state,
    item,
    seasons,
    episode2,
    overlay,
    title,
    subtitle,
    seasonLabel,
    seasonsContainer,
    episodesContainer,
    focus,
    notify,
    hideInfobar,
    closePlaySettingsIfOpen,
    focusPlayer,
    playEpisode,
    respondSeason(episodes: BrowserEpisode[]) {
      pendingSeason?.(episodes, null);
    },
    respondDetail() {
      pendingDetail?.();
    },
    host
  };
}

afterEach(() => {
  resetEpisodeBrowserRuntime();
  vi.clearAllMocks();
});

describe("episodeBrowser", () => {
  it("opens the browser, renders the seasons and focuses the current episode", () => {
    const harness = createHarness();

    expect(openEpisodeBrowser()).toBe(true);

    expect(harness.state.episodeBrowserOpen).toBe(true);
    expect(harness.state.browserSeason).toBe(0);
    expect(harness.overlay.classes.has("is-active")).toBe(true);
    expect(harness.title.textContent).toBe("Serie");
    expect(harness.subtitle.textContent).toBe("Reproduciendo T1 E2 · Episodio 2");
    expect(harness.seasonLabel.textContent).toBe("Episodios · Temporada 1");
    expect(findBySelector(harness.seasonsContainer, ".pe-season")).toHaveLength(2);
    expect(findBySelector(harness.episodesContainer, ".pe-ep")).toHaveLength(2);
    expect(findBySelector(harness.episodesContainer, ".pe-ep.is-current")).toHaveLength(1);
    expect(harness.focus).toHaveBeenCalled();
    expect(harness.hideInfobar).toHaveBeenCalledTimes(1);
  });

  it("refuses to open without a series or player item", () => {
    const harness = createHarness();
    harness.state.playerItem = null;
    expect(openEpisodeBrowser()).toBe(false);

    harness.state.playerItem = { ...harness.item };
    harness.host.isSeries = () => false;
    expect(openEpisodeBrowser()).toBe(false);
  });

  it("loads series details before opening when episodes are missing", () => {
    const harness = createHarness();
    harness.item.episodes = [];
    harness.item._detailsLoaded = false;
    harness.item.seasons = [{ id: "s1", number: 1, _episodes: [] }];
    harness.state.playerEpisode = null;
    harness.seasons[0]!._episodes = [];

    openEpisodeBrowser();
    expect(harness.notify).toHaveBeenCalledWith("Cargando capítulos…");
    expect(harness.state.episodeBrowserOpen).toBe(false);

    harness.item.episodes = [{ id: "e1", number: 1 }];
    harness.item._detailsLoaded = true;
    harness.seasons[0]!._episodes = harness.item.episodes;
    harness.respondDetail();

    expect(harness.state.episodeBrowserOpen).toBe(true);
    expect(harness.state.playerEpisode).toEqual({ id: "e1", number: 1 });
  });

  it("closes and restores player focus only when requested by navigation", () => {
    const harness = createHarness();
    openEpisodeBrowser();

    expect(closeEpisodeBrowser(false)).toBe(true);
    expect(harness.overlay.classes.has("is-active")).toBe(false);
    expect(harness.focusPlayer).toHaveBeenCalledTimes(1);
    expect(closeEpisodeBrowser(false)).toBe(false);

    harness.state.episodeBrowserOpen = true;
    closeEpisodeBrowser(true);
    expect(harness.focusPlayer).toHaveBeenCalledTimes(1);
  });

  it("selects a season and renders its episodes", () => {
    const harness = createHarness();
    openEpisodeBrowser();

    expect(selectBrowserSeason(1, false)).toBe(true);

    expect(harness.state.browserSeason).toBe(1);
    expect(harness.seasonLabel.textContent).toBe("Episodios · Temporada 2");
    const seasons = findBySelector(harness.seasonsContainer, ".pe-season");
    expect(seasons[1]?.classes.has("is-selected")).toBe(true);
    expect(findBySelector(harness.episodesContainer, ".pe-ep")).toHaveLength(1);
    expect(harness.focus).toHaveBeenCalledTimes(1);
  });

  it("focuses the first episode when selecting a season explicitly", () => {
    const harness = createHarness();
    openEpisodeBrowser();

    selectBrowserSeason(1, true);

    expect(harness.focus).toHaveBeenCalledTimes(2);
  });

  it("loads missing season episodes and renders them", () => {
    const harness = createHarness();
    harness.seasons[1]!._episodes = [];
    harness.state.playerItem = harness.item;
    openEpisodeBrowser();
    selectBrowserSeason(1, false);
    expect(findBySelector(harness.episodesContainer, ".pe-loading")).toHaveLength(1);

    harness.seasons[1]!._episodes = [{ id: "e9", number: 9 }];
    harness.respondSeason(harness.seasons[1]!._episodes);

    expect(findBySelector(harness.episodesContainer, ".pe-ep")).toHaveLength(1);
  });

  it("plays the selected episode and closes the browser", () => {
    const harness = createHarness();
    openEpisodeBrowser();
    selectBrowserSeason(1, false);
    const episode = harness.seasons[1]!._episodes?.[0] as BrowserEpisode;

    expect(playBrowserEpisode(episode)).toBe(true);

    expect(harness.playEpisode).toHaveBeenCalledWith(harness.item, episode);
    expect(harness.state.episodeBrowserOpen).toBe(false);
    expect(harness.item.seasonId).toBe("s2");
    expect(harness.item.episodes).toBe(harness.seasons[1]?._episodes);
    expect(harness.state.detailSeason).toBe(1);
    expect(harness.state.playerSeasonIndex).toBe(1);
    expect(harness.state.detailNeedsRebuild).toBe(true);
    expect(harness.closePlaySettingsIfOpen).toHaveBeenCalled();
  });

  it("plays an episode for an explicit season used by the settings row", () => {
    const harness = createHarness();
    const episode = harness.seasons[1]!._episodes?.[0] as BrowserEpisode;

    expect(playEpisodeSelection(episode, 1)).toBe(true);

    expect(harness.playEpisode).toHaveBeenCalledWith(harness.item, episode);
    expect(harness.item.seasonId).toBe("s2");
    expect(harness.state.playerSeasonIndex).toBe(1);
    expect(harness.state.detailSeason).toBe(1);
  });

  it("returns false when the runtime is not attached", () => {
    resetEpisodeBrowserRuntime();
    expect(openEpisodeBrowser()).toBe(false);
    expect(closeEpisodeBrowser()).toBe(false);
    expect(selectBrowserSeason(0, false)).toBe(false);
    expect(playBrowserEpisode({ id: "e1" })).toBe(false);
  });
});
