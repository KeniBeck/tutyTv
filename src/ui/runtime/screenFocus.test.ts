import { afterEach, describe, expect, it, vi } from "vitest";
import { attachFocus } from "./focus";
import {
  attachScreenFocus,
  canFocusLegacyNode,
  firstLegacyFocus,
  focusHomeTab,
  getLegacyFocusables,
  moveLegacyFocus,
  resetScreenFocusRuntime,
  scrollLegacyFocusIntoView
} from "./screenFocus";
import { createAppState } from "./state";

interface FakeNode {
  offsetParent: unknown;
  classes: Set<string>;
  classList: {
    contains(name: string): boolean;
    add(name: string): void;
    remove(name: string): void;
  };
  rect: { left: number; right: number; top: number; bottom: number; width: number; height: number };
  getBoundingClientRect(): FakeNode["rect"];
  children: FakeNode[];
  querySelectorAll(selector: string): FakeNode[];
  containers: Record<string, FakeNode | null>;
  parentNode?: FakeNode | null;
  offsetWidth: number;
  offsetHeight: number;
  scrollWidth: number;
  clientWidth: number;
  scrollTop: number;
  scrollLeft: number;
}

function node(options: Partial<FakeNode> = {}): FakeNode {
  const classes = new Set<string>();
  const value: FakeNode = {
    offsetParent: {},
    classes,
    classList: {
      contains: (name: string) => classes.has(name),
      add: (name: string) => { classes.add(name); },
      remove: (name: string) => { classes.delete(name); }
    },
    rect: { left: 0, right: 10, top: 0, bottom: 10, width: 10, height: 10 },
    getBoundingClientRect: () => value.rect,
    children: [],
    querySelectorAll: (selector: string) => selector === ".focusable" ? value.children : [],
    containers: {},
    parentNode: null,
    offsetWidth: 100,
    offsetHeight: 100,
    scrollWidth: 100,
    clientWidth: 100,
    scrollTop: 0,
    scrollLeft: 0,
    ...options
  };
  return value;
}

function setup() {
  const state = createAppState();
  const tabFocus: Array<FakeNode | null> = [null, null];
  const tabs = [node(), node()];
  const pages = [node(), node()];
  const queryFocusables = vi.fn(() => pages);
  const focus = vi.fn();
  const host = {
    state,
    closest: (element: FakeNode, selector: string) => element.containers[selector] || null,
    queryFocusables,
    getTabFocus: () => tabFocus,
    getTabItems: () => tabs,
    getPages: () => pages,
    getTabPage: () => 1,
    isPlaySettingsOpen: () => false,
    isPlaySettingViewOpen: () => false,
    focus
  };
  attachScreenFocus(host as never);
  return { state, tabFocus, tabs, pages, queryFocusables, focus };
}

describe("screen focus", () => {
  afterEach(() => {
    resetScreenFocusRuntime();
  });

  it("filters hidden and zero-sized focusables", () => {
    const { pages } = setup();
    const visible = node();
    const hidden = node({ offsetParent: null });
    const empty = node({ rect: { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 } });
    pages[0]!.children = [visible, hidden, empty];

    expect(canFocusLegacyNode(visible)).toBe(true);
    expect(canFocusLegacyNode(hidden)).toBe(false);
    expect(canFocusLegacyNode(empty)).toBe(false);
    expect(getLegacyFocusables()).toEqual([pages[0], pages[1]]);
    expect(firstLegacyFocus(pages[0] as never)).toBe(visible);
  });

  it("honors hidden containers from the current screen state", () => {
    const { state } = setup();
    const hiddenPage = node();
    const page = node();
    page.classList.contains = (name: string) => name === "is-current";
    hiddenPage.containers[".home-page"] = page;
    page.classList.contains = () => false;
    state.screen = "home";

    expect(canFocusLegacyNode(hiddenPage)).toBe(false);
    const visible = node();
    visible.containers[".home-page"] = {
      classList: { contains: (name: string) => name === "is-current" }
    } as never;
    expect(canFocusLegacyNode(visible)).toBe(true);
  });

  it("scrolls each scrollable ancestor", () => {
    const { state } = setup();
    state.screen = "home";
    const outer = node({ scrollTop: 0, scrollLeft: 0 });
    const inner = node({ scrollTop: 0, scrollLeft: 0 });
    inner.parentNode = outer;
    const item = node();
    item.rect = { left: -40, right: 10, top: 20, bottom: 120, width: 50, height: 100 };
    inner.rect = { left: 0, right: 100, top: 0, bottom: 100, width: 100, height: 100 };
    outer.rect = inner.rect;
    const innerContainer = { ...inner, parentNode: outer, scrollWidth: 200, clientWidth: 100 } as unknown as FakeNode;
    item.containers[".scrollable"] = innerContainer;
    innerContainer.parentNode = outer;
    outer.containers[".scrollable"] = null;

    expect(scrollLegacyFocusIntoView(item as never)).toBe(true);
    expect(innerContainer.scrollTop).toBe(32);
    expect(innerContainer.scrollLeft).toBe(-52);
  });

  it("prefers a saved tab focus, then the page, then the tab", () => {
    const { tabFocus, tabs, pages, focus } = setup();
    const saved = node();
    saved.parentNode = node();
    tabFocus[0] = saved;
    expect(focusHomeTab(0)).toBe(true);
    expect(focus).toHaveBeenLastCalledWith(saved);

    tabFocus[1] = null;
    const first = node();
    pages[1]!.children = [first];
    expect(focusHomeTab(1)).toBe(true);
    expect(focus).toHaveBeenLastCalledWith(first);

    pages[1]!.children = [];
    expect(focusHomeTab(1)).toBe(true);
    expect(focus).toHaveBeenLastCalledWith(tabs[1]);
  });

  it("delegates directional movement to the focus runtime", () => {
    const { state, pages } = setup();
    const first = node();
    pages[0]!.children = [first];
    const focused = vi.fn();
    attachFocus({
      state,
      byId: () => null,
      getFocusables: () => [first as never],
      getTabFocus: () => [],
      getTabItems: () => [],
      scrollIntoView: vi.fn(),
      onFocusChanged: vi.fn(),
      afterFocus: vi.fn()
    });

    expect(moveLegacyFocus("down")).toBe(true);
    expect(state.focus).toBe(first);
    void focused;
  });
});
