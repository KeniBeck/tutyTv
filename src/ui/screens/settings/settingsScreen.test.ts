import { beforeEach, describe, expect, it, vi } from "vitest";
import { attachSettings, openSettings, resetSettingsRuntime, selectSettingsTab, type SettingsHost, type SettingsMedia } from "./settingsScreen";
import { createAppState } from "../../runtime/state";

class FakeNode {
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
  _index?: number;
  _group?: string;
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

  replaceChild(next: FakeNode, previous: FakeNode) {
    const index = this.children.indexOf(previous);
    if (index !== -1) {
      this.children[index] = next;
      next.parentNode = this;
    }
    return previous;
  }

  querySelector(selector: string) {
    const className = selector.replace(/^\./, "").split(" ")[0] || "";
    return this.children.find((child) => child.className.includes(className)) || null;
  }

  querySelectorAll(selector: string) {
    const className = selector.replace(/^\./, "").split(" ")[0] || "";
    return this.children.filter((child) => child.className.includes(className));
  }
}

function createHost() {
  const state = createAppState();
  const catalog: SettingsMedia[] = [
    { id: "a", title: "Alpha", poster: "a.jpg" },
    { id: "b", title: "Beta", cover: "b.jpg" }
  ];
  const nodes: Record<string, FakeNode> = {
    "settings-menu": new FakeNode(),
    "settings-right": new FakeNode(),
    "screen-settings": new FakeNode()
  };
  const focus = vi.fn();
  const openHistory = vi.fn();
  const host: SettingsHost = {
    state,
    getProfile: () => ({
      id: "profile-1",
      history: [{ id: "a", title: "Alpha", poster: "a.jpg", series: true, episodeNumber: 2, position: 120 }],
      favs: { b: true },
      reminders: { a: { id: "a", title: "Alpha" } }
    }),
    getCatalog: () => catalog,
    isSeries: () => true,
    openHistory,
    formatTime: () => "02:00",
    refreshPlayback: vi.fn(),
    onStreamModeChanged: vi.fn(),
    byId: (id) => (nodes[id] as unknown as ReturnType<SettingsHost["byId"]>) || null,
    el: (tag, className, text) => {
      const node = new FakeNode();
      node.className = className || "";
      node.textContent = text || "";
      return node as unknown as ReturnType<SettingsHost["el"]>;
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
    firstFocus: (root) => ((root as unknown as FakeNode).children[0] as unknown as ReturnType<SettingsHost["firstFocus"]>) || null,
    showScreen: vi.fn((name: string) => {
      state.screen = name;
    })
  };
  return { host, state, nodes, focus, openHistory };
}

describe("settings screen runtime", () => {
  beforeEach(() => {
    resetSettingsRuntime();
  });

  it("opens settings and builds the menu and panels", () => {
    const { host, nodes, focus } = createHost();
    attachSettings(host);
    expect(openSettings()).toBe(true);
    expect(host.showScreen).toHaveBeenCalledWith("settings");
    expect(nodes["settings-menu"]?.children).toHaveLength(7);
    expect(nodes["settings-right"]?.children).toHaveLength(7);
    expect(focus).toHaveBeenCalled();
  });

  it("switches to the history tab and opens an entry", () => {
    const { host, nodes, openHistory } = createHost();
    attachSettings(host);
    openSettings();
    selectSettingsTab(1, true);
    const historyPanel = nodes["settings-right"]?.children.find((child) => child.className.includes("history-panel"));
    const grid = historyPanel?.children.find((child) => child.className.includes("history-grid"));
    const card = grid?.children[0];
    card?._activate?.();
    expect(openHistory).toHaveBeenCalled();
  });

  it("rebuilds profile and history panels on tab changes", () => {
    const { host, nodes } = createHost();
    attachSettings(host);
    openSettings();
    const before = nodes["settings-right"]?.children.length;
    selectSettingsTab(1, true);
    selectSettingsTab(0, true);
    expect(nodes["settings-right"]?.children.length).toBe(before);
  });

  it("marks the settings screen as history view", () => {
    const { host, nodes } = createHost();
    attachSettings(host);
    openSettings();
    selectSettingsTab(1, false);
    expect(nodes["screen-settings"]?.classList.contains("is-history-view")).toBe(true);
    selectSettingsTab(0, false);
    expect(nodes["screen-settings"]?.classList.contains("is-history-view")).toBe(false);
  });
});
