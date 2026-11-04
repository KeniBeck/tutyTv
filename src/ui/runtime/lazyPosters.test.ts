import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppState } from "./state";
import {
  attachLazyPosters,
  isPosterVisible,
  loadVisiblePosters,
  resetLazyPostersRuntime,
  scheduleLazyPosters
} from "./lazyPosters";

function image(attrs: Record<string, string> = {}) {
  const values = new Map(Object.entries(attrs));
  return {
    style: { display: "none" },
    src: "",
    classList: { contains: () => true },
    getAttribute: (name: string) => values.get(name) ?? null,
    setAttribute: (name: string, value: string) => { values.set(name, value); },
    removeAttribute: (name: string) => { values.delete(name); },
    getBoundingClientRect: () => ({ bottom: 100, top: 0, right: 100, left: 0 })
  };
}

function setup(screen = "home", visible = true) {
  const state = createAppState();
  state.screen = screen;
  const posters = [image({ "data-poster-src": "poster.jpg" })];
  const page = {
    classList: { contains: (name: string) => name === "is-current" && visible },
    getBoundingClientRect: () => ({ bottom: 100, top: 0, right: 100, left: 0 })
  };
  const host = {
    state,
    closest: (_node: unknown, selector: string) => selector === ".poster, .bento" ? page : selector === ".home-page" ? page : null,
    queryPosters: () => posters,
    getViewport: () => ({ width: 1920, height: 1080 })
  };
  attachLazyPosters(host as never);
  return { state, posters, page };
}

describe("lazy posters", () => {
  afterEach(() => {
    resetLazyPostersRuntime();
    vi.useRealTimers();
  });

  it("loads visible posters inside the viewport", () => {
    const { posters } = setup();
    expect(loadVisiblePosters()).toBe(true);
    expect(posters[0]?.src).toBe("poster.jpg");
    expect(posters[0]?.style.display).toBe("");
  });

  it("clears sources outside the active page", () => {
    const { posters } = setup("home", false);
    posters[0]!.src = "poster.jpg";
    posters[0]!.setAttribute("src", "poster.jpg");

    expect(loadVisiblePosters()).toBe(true);
    expect(posters[0]?.src).toBe("");
    expect(posters[0]?.getAttribute("src")).toBeNull();
  });

  it("handles search and detail visibility", () => {
    const search = setup("search");
    expect(isPosterVisible(search.posters[0] as never)).toBe(false);

    const detail = setup("detail");
    expect(isPosterVisible(detail.posters[0] as never)).toBe(false);
  });

  it("schedules a delayed load", () => {
    vi.useFakeTimers();
    const { posters } = setup();
    expect(scheduleLazyPosters()).toBe(true);
    expect(posters[0]?.src).toBe("");
    vi.advanceTimersByTime(80);
    expect(posters[0]?.src).toBe("poster.jpg");
  });
});
