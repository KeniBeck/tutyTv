import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyFilter, attachSearch, closeFilterPanel, openFilterPanel, openSearchScreen, resetSearch, resetSearchRuntime, setSearchQuery, type SearchHost, type SearchItem } from "./searchScreen";
import { createAppState } from "../../runtime/state";

class FakeNode {
  id = "";
  className = "";
  textContent = "";
  style: Record<string, string> = {};
  children: FakeNode[] = [];
  parentNode: FakeNode | null = null;
  _activate?: () => void;
  _onMove?: (direction: string) => boolean;
  _filterValue?: string;
  _filterLabel?: string;
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

  querySelector(selector: string) {
    if (selector === ".poster") {
      return this.children.find((child) => child.className.includes("poster")) || null;
    }
    return null;
  }

  querySelectorAll() {
    return [];
  }
}

function createHost() {
  const state = createAppState();
  const catalog: SearchItem[] = [
    { id: "a", title: "Alpha", category: "destacado", genres: ["Acción"] },
    { id: "b", title: "Beta", category: "serie", genres: ["Drama"] }
  ];
  const nodes: Record<string, FakeNode> = {
    "search-keyboard": new FakeNode(),
    "search-hot": new FakeNode(),
    "search-results": new FakeNode(),
    "search-empty": new FakeNode(),
    "search-hot-grid": new FakeNode(),
    "search-result-grid": new FakeNode(),
    "search-nav": new FakeNode(),
    "screen-search": new FakeNode(),
    "filter-panel": new FakeNode(),
    "home-notify": new FakeNode(),
    app: new FakeNode()
  };
  const focus = vi.fn();
  const host: SearchHost = {
    state,
    getCatalog: () => catalog,
    getHotSearches: () => [catalog[0]!],
    isPortal: () => false,
    searchRemote: vi.fn(),
    normalizeItem: (item) => item as SearchItem,
    buildPoster: (_item, _left, _top, _width, _height) => {
      const node = new FakeNode();
      node.className = "poster focusable";
      return node as unknown as ReturnType<SearchHost["buildPoster"]>;
    },
    byId: (id) => (nodes[id] as unknown as ReturnType<SearchHost["byId"]>) || null,
    el: (tag, className, text) => {
      const node = new FakeNode();
      node.className = className || "";
      node.textContent = text || "";
      return node as unknown as ReturnType<SearchHost["el"]>;
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
    focus,
    canFocus: () => true,
    firstFocus: (root) => ((root as unknown as FakeNode).children[0] as unknown as ReturnType<SearchHost["firstFocus"]>) || null,
    showScreen: vi.fn((name: string) => {
      state.screen = name;
    }),
    getAppRoot: () => nodes["app"] as unknown as ReturnType<SearchHost["getAppRoot"]>,
    getNotify: () => nodes["home-notify"] as unknown as ReturnType<SearchHost["getNotify"]>
  };
  state.screen = "home";
  const focusNode = new FakeNode() as unknown as SearchHost["state"]["focus"] & {
    closest(selector: string): null;
  };
  focusNode.closest = () => null;
  state.focus = focusNode;
  return { host, state, nodes, catalog, focus };
}

describe("search screen runtime", () => {
  beforeEach(() => {
    resetSearchRuntime();
  });

  it("opens search and builds the keyboard and hot grid", () => {
    const { host, nodes, focus } = createHost();
    attachSearch(host);
    expect(openSearchScreen()).toBe(true);
    expect(host.showScreen).toHaveBeenCalledWith("search");
    expect(nodes["search-keyboard"]?.children.length).toBeGreaterThan(3);
    expect(nodes["search-hot-grid"]?.children.length).toBe(1);
    expect(focus).toHaveBeenCalled();
  });

  it("filters local results and renders cards", () => {
    const { host, nodes } = createHost();
    attachSearch(host);
    openSearchScreen();
    setSearchQuery("a");
    expect(nodes["search-result-grid"]?.children.length).toBe(2);
    expect(nodes["search-results"]?.classList.contains("is-active")).toBe(true);
  });

  it("shows the empty state when there are no matches", () => {
    const { host, nodes } = createHost();
    attachSearch(host);
    openSearchScreen();
    setSearchQuery("zzz");
    expect(nodes["search-empty"]?.classList.contains("is-active")).toBe(true);
  });

  it("applies a filter and opens the search results", () => {
    const { host, nodes, state } = createHost();
    attachSearch(host);
    expect(openFilterPanel()).toBe(true);
    expect(state.filterOpen).toBe(true);
    expect(applyFilter("Todos", "*")).toBe(true);
    expect(host.showScreen).toHaveBeenCalledWith("search");
    expect(nodes["search-result-grid"]?.children.length).toBe(2);
    expect(nodes["search-nav"]?.textContent).toContain("Filtro: Todos");
  });

  it("closes the filter panel and restores focus", () => {
    const { host, state, focus } = createHost();
    attachSearch(host);
    openFilterPanel();
    focus.mockClear();
    expect(closeFilterPanel()).toBe(true);
    expect(state.filterOpen).toBe(false);
    expect(focus).toHaveBeenCalled();
  });

  it("resets query and results", () => {
    const { host, nodes } = createHost();
    attachSearch(host);
    openSearchScreen();
    setSearchQuery("a");
    expect(resetSearch()).toBe(true);
    expect(nodes["search-result-grid"]?.children).toHaveLength(0);
    expect(nodes["search-results"]?.classList.contains("is-active")).toBe(false);
  });
});
