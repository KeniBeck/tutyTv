import { describe, expect, it } from "vitest";
import type { AppState } from "../../runtime/state";
import { buildHomeLivePage, type HomeLiveNode, type HomeLivePageHost } from "./homeLivePage";

class FakeNode implements HomeLiveNode {
  style: { right?: string } = {};
  className = "";
  id = "";
  preload = "";
  muted = false;
  volume = 0;
  children: FakeNode[] = [];
  attrs: Record<string, string> = {};
  _label?: string;
  _channel?: number;
  _activate?: (() => void) | null;
  _onMove?: ((direction: string) => boolean) | null;
  appendChild(node: HomeLiveNode) { this.children.push(node as FakeNode); }
  setAttribute(name: string, value: string) { this.attrs[name] = value; }
}

function createHarness() {
  const focused: Array<HomeLiveNode | null> = [];
  const selected: Array<[number, boolean | undefined]> = [];
  const calls: string[] = [];
  const rows: FakeNode[] = [{ _channel: 0 }, { _channel: 1 }, { _channel: 2 }].map((row) => Object.assign(new FakeNode(), row));
  const host: HomeLivePageHost = {
    state: { channel: 1, screen: "home", tab: 0 } as unknown as AppState,
    getChannels: () => [{ name: "A" }, { name: "B" }, { name: "C" }],
    getRows: () => rows,
    createVideo: () => new FakeNode(),
    el: () => new FakeNode(),
    focus: (node) => focused.push(node),
    canFocus: () => true,
    openCategories: () => calls.push("categories"),
    toggleFavorites: () => calls.push("favorites"),
    openSearch: () => calls.push("search"),
    selectChannel: (index, force) => selected.push([index, force]),
    openPlayer: () => calls.push("player"),
    focusLive: () => calls.push("live"),
    focusTab: () => calls.push("tab")
  };
  return { host, rows, focused, selected, calls };
}

describe("homeLivePage", () => {
  it("builds the live preview, list, fast actions and focus target", () => {
    const page = new FakeNode();
    const { host } = createHarness();
    const refs = buildHomeLivePage(page, host);
    const video = refs.video as FakeNode;
    const container = refs.container as FakeNode;
    expect(video.className).toBe("live-preview-video");
    expect(video.muted).toBe(true);
    expect(video.volume).toBe(0);
    expect(video.attrs).toMatchObject({ muted: "muted", playsinline: "" });
    expect(container.children).toContain(video);
    expect(refs.channelLabel.style.right).toBe("112.5px");
    expect(refs.fastAll.id).toBe("live-btn-all");
    expect(refs.fastFav.id).toBe("live-btn-fav");
    expect(refs.fastSearch.id).toBe("live-btn-srch");
    expect(page.children.length).toBe(6);
  });

  it("wires fast buttons and their navigation", () => {
    const page = new FakeNode();
    const { host, calls, focused, rows } = createHarness();
    const refs = buildHomeLivePage(page, host);
    refs.fastAll._activate?.();
    refs.fastFav._activate?.();
    refs.fastSearch._activate?.();
    expect(calls).toEqual(["categories", "favorites", "search"]);
    expect(refs.fastAll._onMove?.("right")).toBe(true);
    expect(focused.at(-1)).toBe(refs.fastFav);
    expect(refs.fastFav._onMove?.("left")).toBe(true);
    expect(focused.at(-1)).toBe(refs.fastAll);
    expect(refs.fastAll._onMove?.("up")).toBe(true);
    expect(calls).toContain("live");
    expect(refs.fastFav._onMove?.("down")).toBe(true);
    expect(focused.at(-1)).toBe(rows[1]);
  });

  it("moves the live focus and opens the player", () => {
    const page = new FakeNode();
    const { host, calls, selected, focused, rows } = createHarness();
    const refs = buildHomeLivePage(page, host);
    expect(refs.focus._onMove?.("up")).toBe(true);
    expect(selected.at(-1)).toEqual([0, undefined]);
    expect(refs.focus._onMove?.("down")).toBe(true);
    expect(selected.at(-1)).toEqual([2, undefined]);
    expect(refs.focus._onMove?.("right")).toBe(true);
    expect(focused.at(-1)).toBe(rows[1]);
    expect(refs.focus._onMove?.("left")).toBe(true);
    expect(calls.at(-1)).toBe("tab");
    refs.focus._activate?.();
    expect(calls.at(-1)).toBe("player");
  });

  it("does not move when a live focus direction has no target", () => {
    const page = new FakeNode();
    const { host } = createHarness();
    host.state.channel = 0;
    host.getChannels = () => [];
    host.getRows = () => [];
    const refs = buildHomeLivePage(page, host);
    expect(refs.focus._onMove?.("up")).toBe(true);
    expect(refs.focus._onMove?.("down")).toBe(true);
    expect(refs.focus._onMove?.("right")).toBe(true);
    expect(refs.focus._onMove?.("invalid")).toBe(false);
  });
});
