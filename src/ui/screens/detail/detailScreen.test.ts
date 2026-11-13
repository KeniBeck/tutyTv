import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  attachDetail,
  closeSeasonPopup,
  closeSettingsPopup,
  hasSeasonPopup,
  hasSettingsPopup,
  renderDetail,
  resetDetailRuntime,
  syncDetailCurrentEpisode,
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
  offsetTop = 0;
  offsetHeight = 0;
  scrollTop = 0;
  scrollHeight = 0;
  clientHeight = 0;
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
  state.screen = "detail";
  const nodes: Record<string, FakeNode> = {
    "detail-left": new FakeNode(),
    "detail-player": new FakeNode(),
    "detail-buttons": new FakeNode(),
    "detail-bottom": new FakeNode(),
    "screen-detail": new FakeNode(),
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
  const openDetail = vi.fn();
  const toggleSmooth = vi.fn(() => true);
  const toast = vi.fn();
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
    toast,
    openDetail,
    play,
    playEpisode,
    startPlayback,
    openLanguage,
    isSmooth: () => false,
    toggleSmooth,
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
      if (node.className === "season-popup") {
        node.clientHeight = 108;
      }
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
  return {
    host,
    state,
    nodes,
    focus,
    toggleFavorite,
    toggleReminder,
    play,
    playEpisode,
    startPlayback,
    openLanguage,
    openDetail,
    toggleSmooth,
    loadSeason,
    toast
  };
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
    nodes["screen-detail"]!.classList.add("is-synopsis-open");

    expect(renderDetail(movie)).toBe(true);
    expect(nodes["screen-detail"]!.classList.contains("is-synopsis-open")).toBe(false);
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

  it("renders episode thumbnails when a picture is available", () => {
    const { host, nodes } = createHost();
    attachDetail(host);
    renderDetail({
      id: "s",
      title: "Series",
      seasons: [{ id: "s1", number: 1 }],
      episodes: [{ id: "e1", number: 1, picture: "https://example.test/e1.jpg" }]
    });

    const episode = nodes["detail-bottom"]!.querySelectorAll(".detail-episode")[0];
    expect(episode?.className).toContain("has-thumb");
    const thumb = episode?.children.find((node) => node.className.includes("detail-card-thumb"));
    const image = thumb?.children.find((node) => node.className.includes("detail-card-img"));
    expect(image?.src).toBe("https://example.test/e1.jpg");
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

    const seasonButton = nodes["detail-bottom"]!.querySelector(".detail-season");
    expect(seasonButton).toBeDefined();
    seasonButton?._activate?.();
    expect(hasSeasonPopup()).toBe(true);
    const popup = nodes["detail-bottom"]!.children.find((node) => node.className.includes("season-popup"));
    popup?.children[1]?._activate?.();
    expect(state.detailSeason).toBe(1);
    expect(loadSeason).toHaveBeenCalledWith(series, 1, expect.any(Function));
    expect(startPlayback).not.toHaveBeenCalled();
    expect(hasSeasonPopup()).toBe(false);

    const episode = nodes["detail-bottom"]!.querySelectorAll(".detail-episode")[0];
    episode?._activate?.();
    expect(playEpisode).toHaveBeenCalled();
  });

  it("shows skeletons while a season loads and restores the previous season on failure", () => {
    const { host, state, nodes, startPlayback, toast } = createHost();
    attachDetail(host);
    const series: DetailItem = {
      id: "s",
      title: "Series",
      episodes: [{ id: "old", number: 1, title: "Old episode" }],
      seasons: [
        { id: "s1", number: 1 },
        { id: "s2", number: 2 }
      ]
    };
    const deferred: { done: ((ok?: boolean) => void) | null } = { done: null };
    host.loadSeason = vi.fn((_item: DetailItem, _index: number, done: (ok?: boolean) => void) => {
      deferred.done = done;
    });
    renderDetail(series);
    state.detailSeason = 0;

    const seasonButton = nodes["detail-bottom"]!.querySelector(".detail-season");
    seasonButton?._activate?.();
    const popup = nodes["detail-bottom"]!.children.find((node) => node.className.includes("season-popup"));
    popup?.children[1]?._activate?.();

    expect(state.detailSeason).toBe(1);
    expect(nodes["detail-bottom"]!.querySelectorAll(".is-skeleton")).toHaveLength(6);
    expect(textOf(nodes["detail-bottom"]!)).toContain("Cargando episodios");
    expect(startPlayback).not.toHaveBeenCalled();

    deferred.done?.(false);

    expect(state.detailSeason).toBe(0);
    expect(nodes["detail-bottom"]!.querySelectorAll(".is-skeleton")).toHaveLength(0);
    expect(textOf(nodes["detail-bottom"]!)).toContain("Old episode");
    expect(toast).toHaveBeenCalledWith("No se pudo cargar la temporada");
  });

  it("routes vertical focus through season, ranges and episodes", () => {
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

    focus.mockClear();
    expect(episode?._onMove?.("up")).toBe(true);
    expect(focus).toHaveBeenCalledWith(season);

    focus.mockClear();
    expect(range?._onMove?.("up")).toBe(true);
    expect(focus).toHaveBeenCalledWith(season);

    focus.mockClear();
    expect(season?._onMove?.("down")).toBe(true);
    expect(focus).toHaveBeenCalledWith(range);
  });

  it("keeps focus inside the season popup while navigating seasons", () => {
    const { host, state, nodes, focus } = createHost();
    attachDetail(host);
    state.detailSeason = 0;
    renderDetail({
      id: "s",
      title: "Series",
      seasons: [
        { id: "s1", number: 1 },
        { id: "s2", number: 2 },
        { id: "s3", number: 3 }
      ],
      episodes: [{ id: "e1" }]
    });

    const seasonButton = nodes["detail-bottom"]!.querySelector(".detail-season");
    seasonButton?._activate?.();
    const popup = nodes["detail-bottom"]!.children.find((node) => node.className.includes("season-popup"));
    const first = popup?.children[0];
    const second = popup?.children[1];
    const third = popup?.children[2];
    const popupNode = popup as unknown as FakeNode;
    popupNode.clientHeight = 108;
    [first, second, third].forEach((item, index) => {
      if (item) {
        item.offsetTop = index * 54;
        item.offsetHeight = 54;
      }
    });

    focus.mockClear();
    expect(first?._onMove?.("down")).toBe(true);
    expect(focus).toHaveBeenLastCalledWith(second);
    expect(popupNode.scrollTop).toBe(0);
    expect(second?._onMove?.("down")).toBe(true);
    expect(focus).toHaveBeenLastCalledWith(third);
    expect(popupNode.scrollTop).toBe(54);
    expect(third?._onMove?.("down")).toBe(true);
    expect(focus).toHaveBeenLastCalledWith(third);
    expect(third?._onMove?.("up")).toBe(true);
    expect(focus).toHaveBeenLastCalledWith(second);
    expect(first?._onMove?.("left")).toBe(true);
    expect(focus).toHaveBeenLastCalledWith(second);
    expect(hasSeasonPopup()).toBe(true);
  });

  it("opens the season popup on the current season", () => {
    const { host, state, nodes, focus } = createHost();
    attachDetail(host);
    state.detailSeason = 2;
    renderDetail({
      id: "s",
      title: "Series",
      seasons: Array.from({ length: 10 }, (_, index) => ({ id: `s${index}`, number: index + 1 })),
      episodes: [{ id: "e1" }]
    });

    const seasonButton = nodes["detail-bottom"]!.querySelector(".detail-season");
    seasonButton?._activate?.();
    const popup = nodes["detail-bottom"]!.children.find((node) => node.className.includes("season-popup"));
    expect(popup?.scrollTop).toBe(54);
    expect(focus).toHaveBeenLastCalledWith(popup?.children[2]);
  });

  it("reveals and marks the episode that is currently playing", () => {
    const { host, state, nodes } = createHost();
    attachDetail(host);
    const episodes = Array.from({ length: 45 }, (_, index) => ({
      id: `e${index}`,
      number: index + 1,
      title: `Episode ${index + 1}`
    }));
    const series: DetailItem = {
      id: "s",
      title: "Series",
      episodes,
      seasons: [{ id: "s1", number: 1 }]
    };
    state.detailEpisode = episodes[25];

    renderDetail(series);
    expect(state.detailRange).toBe(1);
    expect(nodes["detail-bottom"]!.querySelectorAll(".detail-range")[1]?.className).toContain("is-selected");
    let currentCards = nodes["detail-bottom"]!
      .querySelectorAll(".detail-episode")
      .filter((node) => node.className.split(/\s+/).includes("is-current"));
    expect(currentCards).toHaveLength(1);
    expect(textOf(currentCards[0]!)).toContain("E26");
    expect(textOf(currentCards[0]!)).toContain("Viendo");

    nodes["detail-bottom"]!.querySelectorAll(".detail-range")[0]?._activate?.();
    expect(state.detailRange).toBe(0);

    state.detailEpisode = episodes[30];
    expect(syncDetailCurrentEpisode(series)).toBe(true);
    expect(state.detailRange).toBe(1);
    currentCards = nodes["detail-bottom"]!
      .querySelectorAll(".detail-episode")
      .filter((node) => node.className.split(/\s+/).includes("is-current"));
    expect(currentCards).toHaveLength(1);
    expect(textOf(currentCards[0]!)).toContain("E31");
  });

  it("opens and closes the synopsis from its focusable control", () => {
    const { host, nodes } = createHost();
    attachDetail(host);
    renderDetail({ id: "m", title: "Movie", synopsis: "A long synopsis" });

    const more = nodes["detail-left"]!.querySelectorAll(".detail-more")[0];
    expect(more?.className).toContain("focusable");
    expect(more?.textContent).toBe("Ver sinopsis");
    more?._activate?.();
    expect(nodes["screen-detail"]!.classList.contains("is-synopsis-open")).toBe(true);
    expect(more?.textContent).toBe("Ocultar sinopsis");

    const text = nodes["detail-left"]!.querySelectorAll(".detail-synopsis")[0]?.querySelector(".text") as unknown as FakeNode;
    text.scrollHeight = 600;
    text.clientHeight = 216;
    expect(more?._onMove?.("down")).toBe(true);
    expect(text.scrollTop).toBe(90);
    expect(more?._onMove?.("down")).toBe(true);
    expect(text.scrollTop).toBe(180);
    expect(more?._onMove?.("up")).toBe(true);
    expect(text.scrollTop).toBe(90);
    text.scrollTop = 0;
    expect(more?._onMove?.("up")).toBe(false);
    text.scrollTop = 384;
    expect(more?._onMove?.("down")).toBe(false);

    more?._activate?.();
    expect(nodes["screen-detail"]!.classList.contains("is-synopsis-open")).toBe(false);
    expect(more?.textContent).toBe("Ver sinopsis");
  });

  it("opens recommendations and closes the settings popup", () => {
    const { host, nodes, focus, openDetail, openLanguage, toggleSmooth } = createHost();
    attachDetail(host);
    renderDetail({ id: "m", title: "Movie", synopsis: "Sin" });

    const related = nodes["detail-bottom"]!.querySelectorAll(".detail-rec-card")[0];
    expect(related).toBeDefined();
    related?._activate?.();
    expect(openDetail).toHaveBeenCalled();

    const settings = nodes["detail-buttons"]!.children.find((node) => textOf(node).includes("Ajustes"));
    settings?._activate?.();
    expect(hasSettingsPopup()).toBe(true);
    expect(focus).toHaveBeenCalled();

    const language = nodes["detail-buttons"]!.querySelectorAll(".detail-setting-row")[0];
    language?._activate?.();
    expect(openLanguage).toHaveBeenCalled();
    expect(hasSettingsPopup()).toBe(false);

    settings?._activate?.();
    const fluid = nodes["detail-buttons"]!.querySelectorAll(".detail-setting-option")[1];
    fluid?._activate?.();
    expect(toggleSmooth).toHaveBeenCalled();
    expect(closeSettingsPopup()).toBe(true);
    expect(hasSettingsPopup()).toBe(false);
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
    const seasonButton = nodes["detail-bottom"]!.querySelector(".detail-season");
    seasonButton?._activate?.();
    expect(hasSeasonPopup()).toBe(true);
    expect(closeSeasonPopup()).toBe(true);
    expect(hasSeasonPopup()).toBe(false);
  });
});
