import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppState } from "../../runtime/state";
import {
  attachPlaySettings,
  closePlaySettings,
  closePlaySettingsDialog,
  openPlaySettings,
  openPlaySettingsDialog,
  refreshPlaySettings,
  resetPlaySettingsRuntime,
  schedulePlaySettingsClose,
  syncPlaySettingsRowFocus,
  type PlaySettingsHost,
  type PlaySettingsNode,
  type PlaySettingsState
} from "./playSettings";

class FakeNode {
  id = "";
  textContent = "";
  style: { display?: string } = {};
  children: FakeNode[] = [];
  classes = new Set<string>();
  attrs: Record<string, string> = {};
  _activate?: (() => void) | null;
  classList = {
    add: (name: string) => { this.classes.add(name); },
    remove: (name: string) => { this.classes.delete(name); },
    contains: (name: string) => this.classes.has(name),
    toggle: (name: string, force?: boolean) => {
      const next = force === undefined ? !this.classes.has(name) : force;
      if (next) this.classes.add(name); else this.classes.delete(name);
    }
  };
  appendChild(node: PlaySettingsNode) { this.children.push(node as FakeNode); }
  getAttribute(name: string) { return this.attrs[name] || null; }
  descendants(): FakeNode[] {
    return this.children.flatMap((child) => [child, ...child.descendants()]);
  }
  querySelector(selector: string) { return this.querySelectorAll(selector)[0] || null; }
  querySelectorAll(selector: string) {
    const className = selector.replace(/^\./, "");
    return this.descendants().filter((node) => node.classes.has(className));
  }
}

function createHarness() {
  const nodes = new Map<string, FakeNode>();
  for (const id of [
    "player-playsetting-view",
    "player-subtitles",
    "psv-sec-selection",
    "psv-episodes-row",
    "psv-sec-audio",
    "psv-btn-episodes",
    "psv-btn-config",
    "dialog-playsettings",
    "dps-audio-options",
    "dps-sub-switch",
    "dps-row-lang",
    "dps-row-size",
    "dps-row-style",
    "dps-lang-options",
    "dps-size-options",
    "dps-style-options",
    "dps-btn-exit"
  ]) {
    const node = new FakeNode();
    node.id = id;
    nodes.set(id, node);
  }
  const state = createAppState() as PlaySettingsState;
  const item = {
    id: "series-1",
    title: "Serie",
    seasonId: "s1",
    seasons: [{ id: "s1", number: 1 }],
    episodes: [{ id: "e1", number: 1 }, { id: "e2", number: 2 }, { id: "e3", number: 3 }]
  };
  state.screen = "player";
  state.playerItem = item;
  state.playerEpisode = item.episodes[0];
  state.playerSeasonIndex = 0;
  state.focus = null;
  let quickOpen = false;
  let fullOpen = false;
  const focus = vi.fn();
  const focusPlayer = vi.fn();
  const hideInfobar = vi.fn();
  const refreshMediaInfo = vi.fn((_item, done: () => void) => done());
  const playEpisode = vi.fn();
  let focusRow: FakeNode | null = null;
  let currentFocus: FakeNode | null = null;
  const subtitleTracks = [{ lang: "es", url: "es.vtt" }];
  let subtitleEnabled = false;
  let currentSubtitle: { lang?: string; url?: string; format?: string } | null = null;
  let subtitleSize = "normal";
  let subtitleStyle = "white";
  const loadSubtitle = vi.fn();
  const savePlaybackPreferences = vi.fn();
  const applySubtitleDisplay = vi.fn();
  const host: PlaySettingsHost = {
    state,
    byId: (id) => nodes.get(id) || null,
    el: (_tag, className = "", text = "") => {
      const node = new FakeNode();
      className.split(" ").filter(Boolean).forEach((name) => node.classes.add(name));
      node.textContent = text;
      return node;
    },
    clear: (node) => { (node as FakeNode).children = []; },
    focus,
    firstFocus: (root) => (root as FakeNode).querySelector(".focusable"),
    getFocusRow: () => focusRow,
    isSeries: () => true,
    getSeasons: (value) => (value as typeof item).seasons,
    getEpisodeRanges: (total) => total > 2 ? [{ start: 0, end: 2 }, { start: 2, end: total }] : [{ start: 0, end: total }],
    refreshMediaInfo,
    playEpisode,
    refreshStreamModeButtons: vi.fn(),
    refreshAspectButtons: vi.fn(),
    hideInfobar,
    ensureStage: vi.fn(),
    focusPlayer,
    isQuickOpen: () => quickOpen,
    setQuickOpen: (value) => { quickOpen = value; },
    isFullOpen: () => fullOpen,
    setFullOpen: (value) => { fullOpen = value; },
    canFocus: () => true,
    getCurrentFocus: () => currentFocus,
    getCurrentItem: () => item,
    renderAudioTracks: vi.fn(),
    getSubtitleTracks: () => subtitleTracks,
    isSubtitleEnabled: () => subtitleEnabled,
    setSubtitleEnabled: (value) => { subtitleEnabled = value; },
    getCurrentSubtitle: () => currentSubtitle,
    setCurrentSubtitle: (value) => { currentSubtitle = value; },
    setSubtitleForced: vi.fn(),
    loadSubtitle,
    getSubtitleSize: () => subtitleSize,
    getSubtitleStyle: () => subtitleStyle,
    setSubtitleSize: (value) => { subtitleSize = value; },
    setSubtitleStyle: (value) => { subtitleStyle = value; },
    savePlaybackPreferences,
    applySubtitleDisplay,
    languagePreference: (_language, current) => current,
    formatLanguage: (language) => language === "es" ? "Español" : language
  };
  attachPlaySettings(host);
  return {
    host, nodes, state, item, focus, focusPlayer, hideInfobar, refreshMediaInfo, playEpisode,
    loadSubtitle, savePlaybackPreferences, applySubtitleDisplay,
    getSubtitleEnabled: () => subtitleEnabled,
    getSubtitleSize: () => subtitleSize,
    getSubtitleStyle: () => subtitleStyle,
    setCurrentFocus(value: FakeNode | null) { currentFocus = value; },
    setFocusRow(value: FakeNode | null) { focusRow = value; },
    setFullOpen(value: boolean) { fullOpen = value; }
  };
}

afterEach(() => {
  resetPlaySettingsRuntime();
  vi.useRealTimers();
});

describe("playSettings", () => {
  it("opens the quick panel, renders episodes and focuses the first episode", () => {
    const harness = createHarness();
    expect(openPlaySettings()).toBe(true);
    expect(harness.hideInfobar).toHaveBeenCalled();
    expect(harness.nodes.get("player-playsetting-view")?.classes.has("is-active")).toBe(true);
    expect(harness.nodes.get("player-subtitles")?.classes.has("shift-up")).toBe(true);
    expect(harness.nodes.get("psv-sec-selection")?.style.display).toBe("block");
    expect(harness.state.playerEpisodeRange).toBe(0);
    expect(harness.refreshMediaInfo).toHaveBeenCalledOnce();
    expect(harness.focus).toHaveBeenCalled();
  });

  it("switches episode ranges and plays the selected episode", () => {
    const harness = createHarness();
    openPlaySettings();
    const row = harness.nodes.get("psv-episodes-row") as FakeNode;
    const ranges = row.children.find((child) => child.classes.has("psv-episode-ranges")) as FakeNode;
    ranges.children[1]?._activate?.();
    expect(harness.state.playerEpisodeRange).toBe(1);
    const numbers = harness.nodes.get("psv-episodes-row")?.children.find((child) => child.classes.has("psv-episode-numbers")) as FakeNode;
    numbers.children[0]?._activate?.();
    expect(harness.playEpisode).toHaveBeenCalledWith(harness.item.episodes[2], 0);
  });

  it("closes the quick panel, clears timers and respects the full dialog", () => {
    const harness = createHarness();
    vi.useFakeTimers();
    openPlaySettings();
    vi.advanceTimersByTime(8000);
    expect(harness.nodes.get("player-playsetting-view")?.classes.has("is-active")).toBe(false);
    expect(harness.focusPlayer).toHaveBeenCalled();

    const calls = harness.focusPlayer.mock.calls.length;
    harness.setFullOpen(true);
    closePlaySettings();
    expect(harness.focusPlayer).toHaveBeenCalledTimes(calls);
  });

  it("schedules close only while the runtime is attached", () => {
    const harness = createHarness();
    vi.useFakeTimers();
    expect(schedulePlaySettingsClose()).toBe(true);
    vi.advanceTimersByTime(8000);
    expect(harness.nodes.get("player-playsetting-view")?.classes.has("is-active")).toBe(false);
    resetPlaySettingsRuntime();
    expect(schedulePlaySettingsClose()).toBe(false);
  });

  it("refreshes rows and syncs the focused row class", () => {
    const harness = createHarness();
    const panel = harness.nodes.get("player-playsetting-view") as FakeNode;
    const row = new FakeNode();
    row.id = "row-1";
    row.classes.add("psv-row");
    panel.appendChild(row);
    harness.setFocusRow(row);
    refreshPlaySettings();
    expect(row.classes.has("is-row-focused")).toBe(true);
    expect(syncPlaySettingsRowFocus()).toBe(true);
  });

  it("opens the full dialog, renders audio and subtitle controls", () => {
    const harness = createHarness();
    expect(openPlaySettingsDialog()).toBe(true);
    expect(harness.nodes.get("dialog-playsettings")?.classes.has("is-active")).toBe(true);
    expect(harness.applySubtitleDisplay).toHaveBeenCalled();
    expect(harness.nodes.get("dps-sub-switch")?.classes.has("is-on")).toBe(false);
    expect(harness.focus).toHaveBeenCalled();
  });

  it("toggles subtitles and selects language, size and style", () => {
    const harness = createHarness();
    const sizeOptions = harness.nodes.get("dps-size-options") as FakeNode;
    const styleOptions = harness.nodes.get("dps-style-options") as FakeNode;
    const big = new FakeNode();
    big.classes.add("dps-btn");
    big.attrs["data-size"] = "big";
    sizeOptions.appendChild(big);
    const yellow = new FakeNode();
    yellow.classes.add("dps-btn");
    yellow.attrs["data-style"] = "yellow";
    styleOptions.appendChild(yellow);

    openPlaySettingsDialog();
    harness.nodes.get("dps-sub-switch")?._activate?.();
    expect(harness.getSubtitleEnabled()).toBe(true);
    expect(harness.loadSubtitle).toHaveBeenCalled();
    expect(harness.state.playback.subtitle).toBe(true);
    expect(harness.savePlaybackPreferences).toHaveBeenCalled();

    const languageOptions = harness.nodes.get("dps-lang-options") as FakeNode;
    languageOptions.children[0]?._activate?.();
    expect(harness.state.playback.subCode).toBe("es");
    expect(harness.loadSubtitle).toHaveBeenCalledTimes(2);

    big._activate?.();
    expect(harness.getSubtitleSize()).toBe("big");
    expect(harness.state.playback.size).toBe(1);
    yellow._activate?.();
    expect(harness.getSubtitleStyle()).toBe("yellow");
    expect(harness.state.playback.style).toBe(1);
    expect(harness.applySubtitleDisplay).toHaveBeenCalled();
  });

  it("closes the full dialog back to the quick panel or previous focus", () => {
    const harness = createHarness();
    const previous = new FakeNode();
    harness.setCurrentFocus(previous);
    openPlaySettingsDialog();
    expect(closePlaySettingsDialog()).toBe(true);
    expect(harness.nodes.get("dialog-playsettings")?.classes.has("is-active")).toBe(false);
    expect(harness.focus).toHaveBeenLastCalledWith(previous);

    openPlaySettings();
    openPlaySettingsDialog();
    closePlaySettingsDialog();
    expect(harness.focus).toHaveBeenLastCalledWith(harness.nodes.get("psv-btn-config"));
  });
});
