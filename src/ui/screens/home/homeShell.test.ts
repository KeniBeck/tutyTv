import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppState } from "../../runtime/state";
import {
  buildHomeShell,
  stopHomeShellClock,
  type HomeShellHost,
  type HomeShellNode
} from "./homeShell";

class FakeNode {
  id = "";
  textContent = "";
  innerHTML = "";
  style: { backgroundImage?: string } = {};
  children: FakeNode[] = [];
  classes = new Set<string>();
  _tab?: number;
  _channel?: number;
  _activate?: (() => void) | null;
  _onMove?: ((direction: string) => boolean) | null;
  classList = {
    add: (name: string) => { this.classes.add(name); },
    remove: (name: string) => { this.classes.delete(name); },
    toggle: (name: string, force?: boolean) => {
      const next = force === undefined ? !this.classes.has(name) : force;
      if (next) this.classes.add(name); else this.classes.delete(name);
    }
  };
  appendChild(node: HomeShellNode) { this.children.push(node as FakeNode); }
}

function createHarness() {
  const nodes = new Map<string, FakeNode>();
  for (const id of ["home-pages", "home-notify", "home-tabs", "notify-time"]) {
    const node = new FakeNode();
    node.id = id;
    nodes.set(id, node);
  }
  const state = createAppState();
  state.tab = 1;
  state.channel = 2;
  const calls: string[] = [];
  const rows = [{ _channel: 0 }, { _channel: 1 }, { _channel: 2 }].map((row) => Object.assign(new FakeNode(), row));
  const tabs = [
    { label: "TV", page: 0, icon: "live" },
    { label: "Películas", page: 1, icon: "movie" },
    { label: "Series", page: 2, icon: "serie" }
  ];
  const host: HomeShellHost = {
    state,
    byId: (id) => nodes.get(id) || null,
    el: (_tag, className = "", text = "") => {
      const node = new FakeNode();
      className.split(" ").filter(Boolean).forEach((name) => node.classes.add(name));
      node.textContent = text;
      return node;
    },
    clear: (node) => { (node as FakeNode).children = []; },
    focus: (node) => calls.push(`focus:${(node as FakeNode | null)?._channel ?? (node as FakeNode | null)?._tab ?? "none"}`),
    getTabs: () => tabs,
    getIcons: () => ({ live: "<svg>live</svg>", movie: "<svg>movie</svg>" }),
    getPageCount: () => 3,
    getInitialPage: () => 1,
    getChannels: () => rows,
    getLiveFocus: () => null,
    selectTab: (index, focus) => calls.push(`tab:${index}:${focus}`),
    focusHomeTab: (index) => calls.push(`home-tab:${index}`),
    openSettings: () => calls.push("settings"),
    openSearch: () => calls.push("search"),
    openFilter: () => calls.push("filter")
  };
  return { host, nodes, state, calls, rows, tabs };
}

afterEach(() => {
  stopHomeShellClock();
  vi.useRealTimers();
});

describe("homeShell", () => {
  it("builds pages, tabs, notifications and the clock", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 15, 7, 0));
    const harness = createHarness();
    const refs = buildHomeShell(harness.host);
    expect(refs).not.toBeNull();
    expect(refs?.pages).toHaveLength(3);
    expect((refs?.pages[0] as FakeNode).classes.has("is-current")).toBe(true);
    expect(refs?.initialPage).toBe(1);
    expect(refs?.tabs).toHaveLength(3);
    expect((refs?.tabs[1] as FakeNode).children.map((child) => child.innerHTML)).toContain("<svg>movie</svg>");
    expect(harness.nodes.get("home-notify")?.children.length).toBe(6);
    expect(harness.nodes.get("notify-time")?.textContent).toBe("3:07 PM");
  });

  it("activates tabs and focuses the correct target", () => {
    const harness = createHarness();
    const refs = buildHomeShell(harness.host);
    refs?.tabs[1]?._activate?.();
    expect(harness.calls).toContain("tab:1:false");
    expect(harness.calls).toContain("home-tab:1");
    refs?.tabs[0]?._activate?.();
    expect(harness.calls).toContain("tab:0:false");
    expect(harness.calls).toContain("focus:2");
    expect(refs?.tabs[1]?._onMove?.("up")).toBe(true);
    expect(harness.calls).toContain("tab:0:false");
    expect(refs?.tabs[1]?._onMove?.("down")).toBe(true);
    expect(refs?.tabs[1]?._onMove?.("right")).toBe(true);
    expect(refs?.tabs[1]?._onMove?.("left")).toBe(true);
    expect(refs?.tabs[1]?._onMove?.("other")).toBe(false);
  });

  it("wires notification actions", () => {
    const harness = createHarness();
    buildHomeShell(harness.host);
    const items = harness.nodes.get("home-notify")?.children.filter((child) => child.classes.has("notify-item")) || [];
    items[0]?._activate?.();
    items[1]?._activate?.();
    items[2]?._activate?.();
    expect(harness.calls).toEqual(expect.arrayContaining(["search", "filter", "settings"]));
  });
});
