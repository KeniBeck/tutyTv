import { beforeEach, describe, expect, it, vi } from "vitest";
import { attachLiveMenu, closeCategories, openCategories, openSearch, resetLiveMenuRuntime, toggleFavorites, type LiveCategory, type LiveMenuHost } from "./liveMenu";
import type { LiveChannel, LiveNode } from "./liveList";
import { createAppState } from "../../runtime/state";

class FakeNode {
  className = "";
  textContent = "";
  style: Record<string, string> = {};
  children: FakeNode[] = [];
  parentNode: FakeNode | null = null;
  _activate?: () => void;
  _char?: string;
  _special?: string;
  _liveCat?: LiveCategory;
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

  querySelector(): FakeNode | null {
    return null;
  }
}

function createHost() {
  const state = createAppState();
  const categories: LiveCategory[] = [
    { id: 1, name: "Todos" },
    { id: 2, name: "Deportes" }
  ];
  const channels: LiveChannel[] = [
    { id: "a", name: "Canal A", logo: "a.png" },
    { id: "b", name: "Canal B" }
  ];
  const nodes: Record<string, FakeNode> = {
    "live-categories": new FakeNode(),
    "live-cat-grid": new FakeNode(),
    "live-cat-sub": new FakeNode(),
    "live-cat-close": new FakeNode(),
    "live-search": new FakeNode(),
    "live-search-list": new FakeNode(),
    "live-search-sub": new FakeNode(),
    "live-search-kb": new FakeNode()
  };
  nodes["live-categories"]?.appendChild(nodes["live-cat-grid"] as FakeNode);
  nodes["live-categories"]?.appendChild(nodes["live-cat-close"] as FakeNode);
  const rows: LiveNode[] = [];
  let favoritesOnly = false;
  const focus = vi.fn();
  const host: LiveMenuHost = {
    state,
    getCategories: () => categories,
    getSelectedCategory: () => categories[0] || null,
    getChannels: () => channels,
    getRows: () => rows,
    getFastFav: () => null,
    getFastAll: () => null,
    getLiveFocus: () => null,
    isFavoritesOnly: () => favoritesOnly,
    setFavoritesOnly: (value) => {
      favoritesOnly = value;
    },
    byId: (id) => (nodes[id] as unknown as LiveNode) || null,
    el: (tag, className, text) => {
      const node = new FakeNode();
      node.className = className || "";
      node.textContent = text || "";
      return node as unknown as LiveNode;
    },
    clear: (element) => {
      (element as unknown as FakeNode).children = [];
    },
    firstFocus: (root) => ((root as unknown as FakeNode).children[0] as unknown as LiveNode) || null,
    canFocus: () => true,
    focus,
    renderList: vi.fn(),
    selectCategory: vi.fn((_category, first, complete) => {
      first();
      complete?.();
    }),
    selectChannel: vi.fn(),
    openPlayer: vi.fn(),
    updateLabel: vi.fn()
  };
  state.screen = "home";
  state.tab = 0;
  state.focus = new FakeNode() as unknown as LiveNode;
  return { host, state, nodes, channels, focus, setFavorites: (value: boolean) => { favoritesOnly = value; } };
}

describe("live menu runtime", () => {
  beforeEach(() => {
    resetLiveMenuRuntime();
  });

  it("opens categories, builds tiles and focuses the selected entry", () => {
    const { host, state, nodes, focus } = createHost();
    attachLiveMenu(host);

    expect(openCategories()).toBe(true);
    expect(state.liveCategoriesOpen).toBe(true);
    expect(nodes["live-categories"]?.classList.contains("is-active")).toBe(true);
    expect(nodes["live-cat-grid"]?.children.length).toBe(4);
    expect(focus).toHaveBeenCalled();
  });

  it("activates the favorites tile and re-renders the list", () => {
    const { host, nodes } = createHost();
    attachLiveMenu(host);
    openCategories();
    const favoriteTile = nodes["live-cat-grid"]?.children[0];
    favoriteTile?._activate?.();
    expect(host.isFavoritesOnly()).toBe(true);
    expect(host.renderList).toHaveBeenCalledWith(true);
  });

  it("closes categories without stealing focus when silent", () => {
    const { host, state, nodes } = createHost();
    attachLiveMenu(host);
    openCategories();
    expect(closeCategories(true)).toBe(true);
    expect(state.liveCategoriesOpen).toBe(false);
    expect(nodes["live-categories"]?.classList.contains("is-active")).toBe(false);
  });

  it("opens search, renders rows and opens a channel result", () => {
    const { host, state, nodes } = createHost();
    attachLiveMenu(host);

    expect(openSearch()).toBe(true);
    expect(state.liveSearchOpen).toBe(true);
    const list = nodes["live-search-list"];
    expect(list?.children.length).toBeGreaterThan(2);
    const channelRow = list?.children.find((row) => row.className.includes("live-sr-row") && !row.className.includes("live-sr-cat"));
    channelRow?._activate?.();
    expect(host.selectChannel).toHaveBeenCalled();
    expect(host.openPlayer).toHaveBeenCalledWith("live");
  });

  it("toggles the favourite filter and focuses the fast button when empty", () => {
    const { host } = createHost();
    attachLiveMenu(host);
    host.getFastFav = () => new FakeNode() as unknown as LiveNode;
    toggleFavorites();
    expect(host.isFavoritesOnly()).toBe(true);
    expect(host.renderList).toHaveBeenCalledWith(true);
  });
});
