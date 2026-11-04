import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppState } from "../../runtime/state";
import {
  attachPlayerLiveCategories,
  closePlayerLiveCategories,
  openPlayerLiveCategories,
  resetPlayerLiveCategoriesRuntime,
  scrollPlayerLiveCategory,
  type LiveCategoryNode
} from "./playerLiveCategories";

class Node {
  textContent = "";
  children: Node[] = [];
  classes = new Set<string>();
  _cat?: Record<string, unknown>;
  _activate?: (() => void) | null;
  classList = {
    add: (name: string) => { this.classes.add(name); },
    remove: (name: string) => { this.classes.delete(name); }
  };
  appendChild(node: Node) {
    this.children.push(node);
  }
  querySelector(selector: string) {
    if (selector === ".pcat-tile.is-selected") {
      return (this.children.find((child) => child.classes.has("is-selected")) as never) || null;
    }
    return null;
  }
}

function setup() {
  const state = createAppState();
  state.screen = "player";
  const overlay = new Node();
  const grid = new Node();
  const sub = new Node();
  const pill = new Node();
  const panel = {
    querySelector: (selector: string) => selector === ".pc-cat-pill.is-selected" ? pill : null
  } as unknown as LiveCategoryNode;
  const host = {
    state,
    ensureOverlay: () => overlay as never,
    ensureGrid: () => grid as never,
    ensureSubtitle: () => sub as never,
    getCategories: () => [
      { id: 1, name: "Todos" },
      { id: 2, name: "Deportes" }
    ],
    getSelectedCategory: () => ({ id: 2, name: "Deportes" }),
    selectCategory: vi.fn(),
    el: (tag: string, className: string, text?: string) => {
      const node = new Node();
      node.textContent = text || "";
      for (const name of className.split(" ")) {
        if (name) node.classes.add(name);
      }
      return node as never;
    },
    clear: (node: LiveCategoryNode) => { (node as unknown as Node).children = []; },
    focus: vi.fn(),
    canFocus: () => true,
    firstFocus: (root: LiveCategoryNode) => (root as unknown as Node).children[0] || null,
    getChannelPanel: () => panel as never,
    hideInfobar: vi.fn(),
    focusPlayer: vi.fn(),
    layoutSelectedCategory: vi.fn(),
    closeChannels: vi.fn()
  };
  attachPlayerLiveCategories(host);
  return { state, host, overlay, grid, sub, pill };
}

describe("player live categories", () => {
  afterEach(() => resetPlayerLiveCategoriesRuntime());

  it("opens the category picker and focuses the selected category", () => {
    const { state, host, overlay, grid, sub } = setup();

    expect(openPlayerLiveCategories()).toBe(true);
    expect(state.categoryPickerOpen).toBe(true);
    expect(overlay.classes.has("is-active")).toBe(true);
    expect(host.hideInfobar).toHaveBeenCalled();
    expect(sub.textContent).toBe("2 categorías · elige una para filtrar los canales");
    expect(grid.children).toHaveLength(2);
    expect(grid.children[1]?.classes.has("is-selected")).toBe(true);
    expect(host.focus).toHaveBeenCalledWith(grid.children[1]);
  });

  it("selects a category and closes silently", () => {
    const { host, grid } = setup();
    openPlayerLiveCategories();
    const tile = grid.children[0] as Node;
    tile._activate?.();

    expect(host.selectCategory).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    expect(host.state.categoryPickerOpen).toBe(false);
    expect(closePlayerLiveCategories(true)).toBe(false);
  });

  it("returns focus to the category pill when closing", () => {
    const { host, pill } = setup();
    openPlayerLiveCategories();

    expect(closePlayerLiveCategories()).toBe(true);
    expect(host.focus).toHaveBeenLastCalledWith(pill);
    expect(host.layoutSelectedCategory).toHaveBeenCalled();
  });

  it("scrolls the selected category into view", () => {
    const container = { scrollLeft: 0, clientWidth: 100 };
    expect(scrollPlayerLiveCategory(container, { offsetLeft: 120, offsetWidth: 50 })).toBe(true);
    expect(container.scrollLeft).toBe(90);
    expect(scrollPlayerLiveCategory(null, null)).toBe(false);
  });
});
