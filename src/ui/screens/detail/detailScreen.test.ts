import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  attachDetail,
  closeSeasonPopup,
  hasSeasonPopup,
  renderDetail,
  resetDetailRuntime,
  type DetailHost,
  type DetailItem,
  type DetailNode
} from "./detailScreen";
import { createAppState } from "../../runtime/state";

class FakeNode {
  id = "";
  tagName = "";
  className = "";
  textContent = "";
  innerHTML = "";
  src = "";
  alt = "";
  style: Record<string, string> = {};
  children: FakeNode[] = [];
  parentNode: FakeNode | null = null;
  _activate?: () => void;
  _onMove?: (direction: string) => boolean;
  _classes = new Set<string>();

  classList = {
    add: (name: string) => this._classes.add(name),
    remove: (name: string) => this._classes.delete(name),
    toggle: (name: string, force?: boolean) => {
      if (force === true) {
        this._classes.add(name);
      } else if (force === false) {
        this._classes.delete(name);
      } else if (this._classes.has(name)) {
        this._classes.delete(name);
      } else {
        this._classes.add(name);
      }
    },
    contains: (name: string) => this._classes.has(name)
  };

  appendChild(child: FakeNode) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child: FakeNode) {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
    }
    child.parentNode = null;
    return child;
  }

  querySelector(selector: string) {
    if (!selector.startsWith(".")) {
      return this.querySelectorAll(selector)[0] || null;
    }
    const className = selector.slice(1).split(" ")[0] || "";
    return this.querySelectorAll(`.${className}`)[0] || null;
  }

  querySelectorAll(selector: string) {
    const simple = selector.replace(/^\./, "").split(" ")[0] || "";
    const byClass = selector.startsWith(".");
    const found: FakeNode[] = [];
    const visit = (node: FakeNode) => {
      for (const child of node.children) {
        const matches = byClass
          ? child.className.split(/\s+/).includes(simple)
          : child.tagName.toLowerCase() === simple.toLowerCase();
        if (matches) {
          found.push(child);
        }
        visit(child);
      }
    };
    visit(this);
    return found;
  }
}

function textOf(node: FakeNode): string {
  return [node.textContent, ...node.children.map(textOf)].join(" ");
}

function createHost() {
  const state = createAppState();
  const nodes: Record<string, FakeNode> = {
    "detail-left": new FakeNode(),
    "detail-player": new FakeNode(),
    "detail-buttons": new FakeNode(),
    "detail-bottom": new FakeNode(),
    app: new FakeNode()
  };
  const catalog: DetailItem[] = [
    { id: "m", title: "Movie", genres: ["Drama"], director: "Dir", actors: "Actors", synopsis: "Syn" }
  ];
  const focus = vi.fn();
  const toggleFavorite = vi.fn(() => true);
  const toggleReminder = vi.fn(() => true);
  const play = vi.fn();
  const playEpisode = vi.fn();
  const startPlayback = vi.fn();
  const openLanguage = vi.fn();
  const loadSeason = vi.fn((item: DetailItem, index: number, done: () => void) => {
    item.seasons![index]!.number = index + 1;
    item.episodes = [{ id: `e-${index}`, number: 1 }];
    state.detailEpisode = item.episodes[0];
    done();
  });

  const host: DetailHost = {
    state,
    getCatalog: () => catalog,
    isSeries: (item) => Array.isArray(item.seasons) && item.seasons.length > 0,
    isFavorite: () => false,
    toggleFavorite,
    isReminderActive: () => false,
    toggleReminder,
    toast: vi.fn(),
    play,
    playEpisode,
    startPlayback,
    openLanguage,
    isSmooth: () => false,
    toggleSmooth: () => true,
    loadSeason,
    buildPoster: (item, left, top, width, height) => {
      const node = new FakeNode();
      node.className = "poster";
      node.textContent = item.title || "";
      node.style.left = `${left}px`;
      node.style.top = `${top}px`;
      node.style.width = `${width}px`;
      node.style.height = `${height}px`;
      return node as unknown as DetailNode;
    },
    byId: (id) => (nodes[id] as unknown as DetailNode) || null,
    el: (tag, className, text) => {
      const node = new FakeNode();
      node.className = className || "";
      node.textContent = text || "";
      node.tagName = tag.toUpperCase();
      return node as unknown as DetailNode;
    },
    text: (value) => {
      const node = new FakeNode();
      node.textContent = value;
      return node as unknown as Node;
    },
    clear: (element) => {
      (element as unknown as FakeNode).children = [];
    },
    place: (element, left, top, width, height) => {
      element.style.left = `${left}px`;
      element.style.top = `${top}px`;
      if (width !== undefined) element.style.width = `${width}px`;
      if (height !== undefined) element.style.height = `${height}px`;
      return element;
    },
    focus
  };
  return { host, state, nodes, focus, toggleFavorite, toggleReminder, play, playEpisode, startPlayback, loadSeason };
}

describe("detail screen runtime", () => {
  beforeEach(() => {
    resetDetailRuntime();
  });

  it("renders a movie and exposes the reminder action", () => {
    const { host, nodes, toggleFavorite, toggleReminder, play } = createHost();
    attachDetail(host);
    const movie: DetailItem = {
      id: "m",
      title: "Movie",
      score: "8.2",
      genres: ["Drama"],
      director: "Dir",
      actors: "Actors",
      synopsis: "Syn"
    };

    expect(renderDetail(movie)).toBe(true);
    expect(textOf(nodes["detail-left"]!)).toContain("Movie");
    expect(textOf(nodes["detail-buttons"]!)).toContain("Recordatorios");
    expect(nodes["detail-bottom"]!.children.some((node) => node.className.includes("detail-season"))).toBe(false);

    nodes["detail-player"]!._activate?.();
    expect(play).toHaveBeenCalledWith(movie, null);

    const favorite = nodes["detail-buttons"]!.children.find((node) => textOf(node).includes("Favorito"));
    favorite?._activate?.();
    expect(toggleFavorite).toHaveBeenCalledWith(movie);

    const reminder = nodes["detail-buttons"]!.children.find((node) => textOf(node).includes("Recordatorios"));
    reminder?._activate?.();
    expect(toggleReminder).toHaveBeenCalledWith(movie);
    expect(textOf(reminder!)).toContain("En recordatorios");
  });

  it("renders seasons, ranges and episodes for a series", () => {
    const { host, state, nodes, playEpisode, startPlayback, loadSeason } = createHost();
    attachDetail(host);
    const episodes = Array.from({ length: 21 }, (_, index) => ({ id: `e${index}`, number: index + 1 }));
    const series: DetailItem = {
      id: "s",
      title: "Series",
      genres: ["Drama"],
      episodes,
      seasons: [
        { id: "s1", number: 1 },
        { id: "s2", number: 2 }
      ]
    };
    state.detailSeason = 0;

    expect(renderDetail(series)).toBe(true);
    const ranges = nodes["detail-bottom"]!.querySelectorAll(".detail-range");
    expect(ranges).toHaveLength(2);
    ranges[1]?._activate?.();
    expect(state.detailRange).toBe(1);

    const seasonButton = nodes["detail-bottom"]!.children.find((node) => node.className.includes("detail-season"));
    expect(seasonButton).toBeDefined();
    seasonButton?._activate?.();
    expect(hasSeasonPopup()).toBe(true);
    const popup = nodes["detail-bottom"]!.children.find((node) => node.className.includes("season-popup"));
    popup?.children[1]?._activate?.();
    expect(state.detailSeason).toBe(1);
    expect(loadSeason).toHaveBeenCalledWith(series, 1, expect.any(Function));
    expect(startPlayback).toHaveBeenCalled();
    expect(hasSeasonPopup()).toBe(false);

    const episode = nodes["detail-bottom"]!.querySelectorAll(".detail-episode")[0];
    episode?._activate?.();
    expect(playEpisode).toHaveBeenCalled();
  });

  it("routes vertical focus through season, ranges, episodes and related", () => {
    const { host, nodes, focus } = createHost();
    attachDetail(host);
    const series: DetailItem = {
      id: "s",
      title: "Series",
      episodes: Array.from({ length: 21 }, (_, index) => ({ id: `e${index}`, number: index + 1 })),
      seasons: [
        { id: "s1", number: 1 },
        { id: "s2", number: 2 }
      ]
    };
    renderDetail(series);
    const bottom = nodes["detail-bottom"]!;
    const season = bottom.querySelector(".detail-season");
    const range = bottom.querySelectorAll(".detail-range")[0];
    const episode = bottom.querySelectorAll(".detail-episode")[0];
    const poster = bottom.querySelectorAll(".poster")[0];

    focus.mockClear();
    expect(episode?._onMove?.("up")).toBe(true);
    expect(focus).toHaveBeenCalledWith(season);

    focus.mockClear();
    expect(range?._onMove?.("up")).toBe(true);
    expect(focus).toHaveBeenCalledWith(season);

    focus.mockClear();
    expect(season?._onMove?.("down")).toBe(true);
    expect(focus).toHaveBeenCalledWith(range);

    focus.mockClear();
    expect(poster?._onMove?.("up")).toBe(true);
    expect(focus).toHaveBeenCalledWith(episode);
  });

  it("closes the season popup on back", () => {
    const { host, state, nodes } = createHost();
    attachDetail(host);
    state.detailSeason = 0;
    renderDetail({
      id: "s",
      title: "Series",
      seasons: [{ id: "s1", number: 1 }, { id: "s2", number: 2 }],
      episodes: [{ id: "e1" }]
    });
    const seasonButton = nodes["detail-bottom"]!.children.find((node) => node.className.includes("detail-season"));
    seasonButton?._activate?.();
    expect(hasSeasonPopup()).toBe(true);
    expect(closeSeasonPopup()).toBe(true);
    expect(hasSeasonPopup()).toBe(false);
  });
});
