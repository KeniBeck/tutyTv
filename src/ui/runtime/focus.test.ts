import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { attachFocus, focusElement, moveFocus } from "./focus";
import { createAppState, type FocusableElement } from "./state";

interface NodeOptions {
  page?: boolean;
  tabs?: boolean;
}

function fakeNode(left: number, top: number, options: NodeOptions = {}) {
  const classes = new Set<string>();
  const node = {
    nodeType: 1,
    parentNode: null,
    matches: (selector: string) => {
      if (selector === ".home-page") {
        return Boolean(options.page);
      }
      if (selector === ".home-tabs") {
        return Boolean(options.tabs);
      }
      return false;
    },
    classList: {
      add: (name: string) => classes.add(name),
      remove: (name: string) => classes.delete(name),
      toggle: (name: string, force?: boolean) => {
        if (force === true) {
          classes.add(name);
        } else if (force === false) {
          classes.delete(name);
        } else if (classes.has(name)) {
          classes.delete(name);
        } else {
          classes.add(name);
        }
      },
      contains: (name: string) => classes.has(name)
    },
    getBoundingClientRect: () => ({
      left,
      right: left + 50,
      top,
      bottom: top + 50,
      width: 50,
      height: 50,
      x: left,
      y: top,
      toJSON: () => ({})
    }),
    classes
  };
  return node as unknown as FocusableElement & { classes: Set<string> };
}

describe("focus runtime", () => {
  beforeEach(() => {
    (globalThis as { document?: Document }).document = {
      querySelector: () => null
    } as unknown as Document;
  });

  afterEach(() => {
    delete (globalThis as { document?: Document }).document;
  });

  it("moves to the nearest aligned candidate and updates focus state", () => {
    const current = fakeNode(100, 100, { page: true });
    const aligned = fakeNode(200, 100);
    const diagonal = fakeNode(160, 180);
    const tab = fakeNode(0, 100, { tabs: true });
    const state = createAppState();
    state.screen = "home";
    state.focus = current;
    const scroll = vi.fn();
    const after = vi.fn();
    const changed = vi.fn();
    const tabFocus: Array<FocusableElement | null> = [];

    attachFocus({
      state,
      byId: () => null,
      getFocusables: () => [current, aligned, diagonal, tab],
      getTabFocus: () => tabFocus,
      getTabItems: () => [tab],
      scrollIntoView: scroll,
      onFocusChanged: changed,
      afterFocus: after
    });

    expect(moveFocus("right")).toBe(true);
    expect(state.focus).toBe(aligned);
    expect(current.classes.has("is-focused")).toBe(false);
    expect(aligned.classes.has("is-focused")).toBe(true);
    expect(changed).toHaveBeenCalledOnce();
    expect(scroll).toHaveBeenCalledWith(aligned);
    expect(after).toHaveBeenCalledOnce();
  });

  it("falls back to the active home tab when moving left from a page", () => {
    const current = fakeNode(100, 100, { page: true });
    const tab = fakeNode(0, 100, { tabs: true });
    const state = createAppState();
    state.screen = "home";
    state.focus = current;

    attachFocus({
      state,
      byId: () => null,
      getFocusables: () => [current, tab],
      getTabFocus: () => [],
      getTabItems: () => [tab],
      scrollIntoView: vi.fn(),
      onFocusChanged: vi.fn(),
      afterFocus: vi.fn()
    });

    expect(moveFocus("left")).toBe(true);
    expect(state.focus).toBe(tab);
  });

  it("skips candidates rejected by the shared focus scorer", () => {
    const current = fakeNode(100, 100, { page: true });
    const candidate = fakeNode(200, 100);
    const state = createAppState();
    state.screen = "detail";
    state.focus = current;

    attachFocus({
      state,
      byId: () => null,
      getFocusables: () => [current, candidate],
      getTabFocus: () => [],
      getTabItems: () => [],
      scrollIntoView: vi.fn(),
      onFocusChanged: vi.fn(),
      afterFocus: vi.fn(),
      score: () => null
    });

    expect(moveFocus("right")).toBe(true);
    expect(state.focus).toBe(current);
  });

  it("honors a component's own move handler and keeps focus", () => {
    const current = fakeNode(100, 100, { page: true });
    current._onMove = () => true;
    const state = createAppState();
    state.screen = "home";
    state.focus = current;

    attachFocus({
      state,
      byId: () => null,
      getFocusables: () => [current, fakeNode(200, 100)],
      getTabFocus: () => [],
      getTabItems: () => [],
      scrollIntoView: vi.fn(),
      onFocusChanged: vi.fn(),
      afterFocus: vi.fn()
    });

    expect(moveFocus("right")).toBe(true);
    expect(state.focus).toBe(current);
  });

  it("focuses an element without scrolling when silent", () => {
    const element = fakeNode(10, 20);
    const state = createAppState();
    const scroll = vi.fn();
    attachFocus({
      state,
      byId: () => null,
      getFocusables: () => [element],
      getTabFocus: () => [],
      getTabItems: () => [],
      scrollIntoView: scroll,
      onFocusChanged: vi.fn(),
      afterFocus: vi.fn()
    });

    expect(focusElement(element, true)).toBe(true);
    expect(state.focus).toBe(element);
    expect(scroll).not.toHaveBeenCalled();
  });
});
