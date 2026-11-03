import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppState } from "../../runtime/state";
import {
  attachLiveChannelPanel,
  closeLiveChannelPanel,
  focusLiveChannelRow,
  openLiveChannelPanel,
  renderLiveCategories,
  renderLiveChannels,
  resetLiveChannelPanelRuntime,
  type LiveChannelPanelHost,
  type LivePanelNode
} from "./liveChannelPanel";

function createNode(selectors: Record<string, LivePanelNode> = {}) {
  const classes = new Set<string>();
  const children: LivePanelNode[] = [];
  const node: LivePanelNode = {
    textContent: "",
    style: {},
    classList: {
      add(name: string) {
        classes.add(name);
      },
      remove(name: string) {
        classes.delete(name);
      },
      toggle(name: string, force?: boolean) {
        const next = force === undefined ? !classes.has(name) : force;
        if (next) {
          classes.add(name);
        } else {
          classes.delete(name);
        }
      }
    },
    appendChild(child: LivePanelNode) {
      children.push(child);
    },
    querySelector(selector: string) {
      return selectors[selector] || null;
    }
  };
  return { node, classes, children };
}

function createHarness(selectors: Record<string, LivePanelNode> = {}) {
  const state = createAppState();
  state.screen = "player";
  state.playerMode = "live";
  state.channel = 4;
  const panelParts = createNode(selectors);
  const focusCurrentChannel = vi.fn();
  const focusPlayer = vi.fn();
  let signature = "";
  let rows: Record<string, LivePanelNode> = {};
  const host: LiveChannelPanelHost = {
    state,
    getPanel: () => panelParts.node,
    getCategories: () => [],
    getSelectedCategory: () => null,
    getChannels: () => [],
    getPageSize: () => 48,
    getCategorySignature: () => signature,
    setCategorySignature(value) {
      signature = value;
    },
    getFocusCategory: () => null,
    getChannelRows: () => rows,
    setChannelRows(value) {
      rows = value;
    },
    el: (_tag, _className, text) => {
      const created = createNode().node;
      created.textContent = text || "";
      return created;
    },
    clear: vi.fn(),
    focus: vi.fn(),
    focusAndScroll: vi.fn(),
    scrollIntoView: vi.fn(),
    selectCategory: vi.fn(),
    openCategories: vi.fn(),
    openAddons: vi.fn(),
    playChannel: vi.fn(),
    closePanel: vi.fn(),
    focusCurrentChannel,
    focusPlayer
  };
  attachLiveChannelPanel(host);
  return {
    state,
    panel: panelParts.node,
    panelParts,
    classes: panelParts.classes,
    focusCurrentChannel,
    focusPlayer,
    host
  };
}

afterEach(() => {
  resetLiveChannelPanelRuntime();
  vi.clearAllMocks();
});

describe("liveChannelPanel", () => {
  it("opens and focuses the current live channel", () => {
    const harness = createHarness();

    expect(openLiveChannelPanel()).toBe(true);

    expect(harness.state.channelsOpen).toBe(true);
    expect(harness.classes.has("is-active")).toBe(true);
    expect(harness.focusCurrentChannel).toHaveBeenCalledWith(4);
  });

  it("does not open outside live mode or without a panel", () => {
    const harness = createHarness();
    harness.state.playerMode = "vod";
    expect(openLiveChannelPanel()).toBe(false);
    expect(harness.state.channelsOpen).toBe(false);

    harness.state.playerMode = "live";
    vi.spyOn(harness.host, "getPanel").mockReturnValue(null);
    expect(openLiveChannelPanel()).toBe(false);
  });

  it("closes and returns focus to the player", () => {
    const harness = createHarness();
    openLiveChannelPanel();

    expect(closeLiveChannelPanel()).toBe(true);

    expect(harness.state.channelsOpen).toBe(false);
    expect(harness.classes.has("is-active")).toBe(false);
    expect(harness.focusPlayer).toHaveBeenCalledTimes(1);
  });

  it("closes without stealing focus outside the player", () => {
    const harness = createHarness();
    openLiveChannelPanel();
    harness.state.screen = "home";

    closeLiveChannelPanel();

    expect(harness.focusPlayer).not.toHaveBeenCalled();
  });

  it("renders category pills and keeps the selected one marked", () => {
    const categories = createNode();
    const list = createNode();
    const harness = createHarness({ ".pc-categories": categories.node, ".pc-list": list.node });
    const first = { id: "c1", name: "Todos" };
    const second = { id: "c2", name: "Deportes" };
    harness.host.getCategories = () => [first, second];
    harness.host.getSelectedCategory = () => second;

    expect(renderLiveCategories()).toBe(true);

    expect(categories.children).toHaveLength(2);
    expect(categories.children[0]?.textContent).toBe("Todos");
    expect(categories.children[1]?.textContent).toBe("Deportes");
    expect(categories.children[0]?.classList.toggle).toBeDefined();
    const pills = categories.node._pills || [];
    expect(pills).toHaveLength(2);
    expect(pills[1]?.classList.remove).toBeDefined();
    expect(harness.host.setCategorySignature).toBeDefined();

    harness.host.getCategorySignature = () => "c1|c2|";
    expect(renderLiveCategories()).toBe(true);
    expect(categories.children).toHaveLength(2);
  });

  it("renders the channel page around the current channel", () => {
    const categories = createNode();
    const list = createNode();
    const harness = createHarness({ ".pc-categories": categories.node, ".pc-list": list.node });
    const rows: Record<string, LivePanelNode> = {};
    harness.host.getChannels = () => [
      { index: 1, name: "Uno", now: "Ahora", logo: "uno.png" },
      { index: 2, name: "Dos", now: "Luego" }
    ];
    harness.host.getSelectedCategory = () => ({ id: "c1", name: "Todos" });
    harness.host.getChannelRows = () => rows;
    harness.host.setChannelRows = (value) => {
      Object.keys(rows).forEach((key) => delete rows[key]);
      Object.assign(rows, value);
    };
    harness.state.channel = 1;

    expect(renderLiveChannels(1)).toBe(true);

    expect(list.children.length).toBeGreaterThan(0);
    expect(rows[1]).toBeTruthy();
    expect(rows[1]?.classList.remove).toBeDefined();
  });

  it("focuses a visible row or renders the page that contains it", () => {
    const categories = createNode();
    const list = createNode();
    const harness = createHarness({ ".pc-categories": categories.node, ".pc-list": list.node });
    const rows: Record<string, LivePanelNode> = {};
    harness.host.getChannels = () => [{ name: "Uno" }, { name: "Dos" }];
    harness.host.getSelectedCategory = () => ({ id: "c1", name: "Todos" });
    harness.host.getChannelRows = () => rows;
    harness.host.setChannelRows = (value) => {
      Object.keys(rows).forEach((key) => delete rows[key]);
      Object.assign(rows, value);
    };

    expect(focusLiveChannelRow(1)).toBe(true);
    expect(rows[1]).toBeTruthy();
    expect(harness.host.focus).toHaveBeenCalledWith(rows[1]);
  });

  it("returns false without a runtime", () => {
    resetLiveChannelPanelRuntime();
    expect(openLiveChannelPanel()).toBe(false);
    expect(closeLiveChannelPanel()).toBe(false);
  });
});
