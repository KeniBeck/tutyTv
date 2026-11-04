import { describe, expect, it, vi } from "vitest";
import { createAppState } from "../../runtime/state";
import {
  buildPlayerStage,
  type PlayerStageHost,
  type PlayerStageNode
} from "./playerStage";

class FakeNode {
  id = "";
  textContent = "";
  innerHTML = "";
  style: Record<string, string | number | undefined> = {};
  children: FakeNode[] = [];
  classes = new Set<string>();
  attrs: Record<string, string> = {};
  offsetLeft = 0;
  offsetWidth = 0;
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
  appendChild(node: PlayerStageNode) {
    const child = node as FakeNode;
    child.parent = this;
    this.children.push(child);
  }
  parent?: FakeNode;
  descendants(): FakeNode[] {
    return this.children.flatMap((child) => [child, ...child.descendants()]);
  }
  querySelector(selector: string) {
    if (selector === ".player-frame") {
      return this.children.find((child) => child.classes.has("player-frame")) || null;
    }
    return this.querySelectorAll(selector)[0] || null;
  }
  querySelectorAll(selector: string) {
    const name = selector.replace(/^\./, "");
    return this.descendants().filter((node) => node.classes.has(name));
  }
  getAttribute(name: string) { return this.attrs[name] || null; }
}

function createHarness() {
  const ids = [
    "player-stage", "player-infobar", "player-vod-infobar", "player-channels",
    "player-categories", "pcat-grid", "pcat-sub", "player-video", "player-status",
    "next-episode-loading", "player-osd-icon", "vod-infobar-poster", "vod-infobar-title",
    "vod-time-current", "vod-time-total", "vod-seekbar", "vod-seek-progress",
    "vod-seek-buffered", "vod-seek-thumb", "player-playsetting-view", "psv-btn-episodes",
    "psv-btn-config", "psv-btn-p1", "psv-btn-p2", "psv-sec-quality", "psv-quality-row",
    "psv-sec-aspect", "psv-sec-player", "psv-btn-feedback", "psv-aspect-row",
    "player-episodes", "pe-title", "pe-sub", "pe-seasons", "pe-seasons-col",
    "pe-episodes", "pe-season-label", "dps-audio-options", "player-subtitles"
  ];
  const nodes = new Map<string, FakeNode>();
  for (const id of ids) {
    const node = new FakeNode();
    node.id = id;
    nodes.set(id, node);
  }
  const frame = new FakeNode();
  frame.classes.add("player-frame");
  nodes.get("player-stage")?.appendChild(frame);
  const state = createAppState();
  state.playerMode = "vod";
  state.channel = 5;
  state.infobar = true;
  const calls: string[] = [];
  const selected: Array<[number, boolean | undefined]> = [];
  const host: PlayerStageHost = {
    state,
    byId: (id) => nodes.get(id) || null,
    el: (_tag, className = "", text = "") => {
      const node = new FakeNode();
      className.split(" ").filter(Boolean).forEach((name) => node.classes.add(name));
      node.textContent = text;
      return node;
    },
    clear: (node) => { (node as FakeNode).children = []; },
    focus: vi.fn(),
    openSeek: (force) => calls.push(`seek:${force}`),
    stepSeek: (delta) => calls.push(`step:${delta}`),
    stepVodSeek: (delta) => calls.push(`vod-step:${delta}`),
    startSeek: () => calls.push("start-seek"),
    openPlaySettings: () => calls.push("quick"),
    openFullSettings: () => calls.push("full"),
    openEpisodeBrowser: () => calls.push("episodes"),
    schedulePlaySettingsClose: () => calls.push("close-timer"),
    setSmooth: (smooth) => calls.push(`smooth:${smooth}`),
    refreshStreamModeButtons: () => calls.push("streams"),
    reloadStreamMode: () => calls.push("reload"),
    applyAspect: (value) => calls.push(`aspect:${value}`),
    applySubtitleDisplay: () => calls.push("subtitle-display"),
    savePlaybackPreferences: () => calls.push("save"),
    openChannels: () => calls.push("channels"),
    closeChannels: () => calls.push("close-channels"),
    selectLiveChannel: (index, force) => selected.push([index, force]),
    hideInfobar: () => calls.push("hide-infobar"),
    showInfobar: () => calls.push("show-infobar"),
    togglePlayPause: () => calls.push("playpause"),
    renderLiveCategories: () => calls.push("categories"),
    renderLiveChannels: () => calls.push("live-channels"),
    toggleFavorite: (channel) => calls.push(`fav:${String(channel.name)}`),
    refreshLiveList: (favoritesOnly) => calls.push(`list:${favoritesOnly}`),
    isFavoritesOnly: () => true,
    getChannels: () => [
      { name: "A" }, { name: "B" }, { name: "C" }, { name: "D" }, { name: "E" }, { name: "F" }
    ]
  };
  return { host, nodes, state, frame, calls, selected };
}

describe("playerStage", () => {
  it("builds the player chrome and returns every reference", () => {
    const harness = createHarness();
    const refs = buildPlayerStage(harness.host);
    expect(refs.stage).toBe(harness.nodes.get("player-stage"));
    expect(refs.frame).toBe(harness.frame);
    expect((refs.stage as FakeNode).classes.has("focusable")).toBe(true);
    expect((refs.infobar as FakeNode).children.length).toBeGreaterThan(10);
    expect((refs.channels as FakeNode).children.length).toBe(5);
    expect(harness.calls).toContain("subtitle-display");
    expect(harness.calls).toContain("save");
    expect(harness.calls).toContain("categories");
    expect(harness.calls).toContain("live-channels");
  });

  it("wires the seekbar and stage for VOD", () => {
    const harness = createHarness();
    const refs = buildPlayerStage(harness.host);
    refs.seekbar?._activate?.();
    expect(harness.calls).toContain("seek:true");
    expect(refs.seekbar?._onMove?.("left")).toBe(true);
    expect(refs.seekbar?._onMove?.("right")).toBe(true);
    expect(refs.seekbar?._onMove?.("down")).toBe(true);
    expect(harness.calls).toEqual(expect.arrayContaining(["step:-1", "step:1", "seek:false"]));
    expect(refs.stage?._onMove?.("left")).toBe(true);
    expect(refs.stage?._onMove?.("right")).toBe(true);
    expect(refs.stage?._onMove?.("down")).toBe(true);
    expect(refs.stage?._onMove?.("up")).toBe(true);
    expect(harness.calls).toEqual(expect.arrayContaining(["vod-step:-10", "vod-step:10", "quick", "start-seek"]));
    refs.stage?._activate?.();
    expect(harness.calls).toContain("playpause");
  });

  it("moves through live channels and toggles the infobar", () => {
    const harness = createHarness();
    harness.state.playerMode = "live";
    harness.state.infobar = true;
    const refs = buildPlayerStage(harness.host);
    expect(refs.stage?._onMove?.("left")).toBe(true);
    expect(refs.stage?._onMove?.("right")).toBe(true);
    expect(refs.stage?._onMove?.("up")).toBe(true);
    expect(refs.stage?._onMove?.("down")).toBe(true);
    expect(harness.selected).toEqual([[4, undefined], [6, undefined]]);
    expect(harness.calls).toEqual(expect.arrayContaining(["channels", "close-channels"]));
    refs.stage?._activate?.();
    expect(harness.calls).toContain("hide-infobar");
    harness.state.infobar = false;
    refs.stage?._activate?.();
    expect(harness.calls).toContain("show-infobar");
  });

  it("wires quick settings, aspect and infobar actions", () => {
    const harness = createHarness();
    const refs = buildPlayerStage(harness.host);
    refs.btnEpisodes?._activate?.();
    refs.btnConfig?._activate?.();
    refs.btnPlayer1?._activate?.();
    refs.btnPlayer2?._activate?.();
    expect(harness.calls).toEqual(expect.arrayContaining(["episodes", "full", "smooth:true", "smooth:false", "reload"]));

    const aspectButton = new FakeNode();
    aspectButton.classes.add("psv-btn");
    aspectButton.attrs["data-aspect"] = "16:9";
    (refs.aspectRow as FakeNode).appendChild(aspectButton);
    const rebuilt = buildPlayerStage(harness.host);
    (rebuilt.aspectRow as FakeNode).children[0]?._activate?.();
    expect(harness.calls).toContain("aspect:16:9");

    const actions = (rebuilt.infobar as FakeNode).children.find((child) => child.classes.has("pi-actions")) as FakeNode;
    const previous = actions.children.find((child) => child.textContent === "Anterior");
    previous?._activate?.();
    expect(harness.selected.at(-1)).toEqual([4, undefined]);
    const favorite = actions.children.find((child) => child.textContent === "Favorito");
    favorite?._activate?.();
    expect(harness.calls).toContain("fav:F");
    expect(harness.calls).toContain("list:true");
    const format = actions.children.find((child) => child.textContent === "Formato");
    format?._activate?.();
    expect((rebuilt.infobar as FakeNode).querySelector(".pi-scale")?.textContent).toBe("16:9");
  });
});
