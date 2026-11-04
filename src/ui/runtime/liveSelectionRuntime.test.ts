import { describe, expect, it, vi } from "vitest";
import { createLiveSelectionRuntime, type LiveSelectionRuntimeDeps } from "./liveSelectionRuntime";
import { createAppState } from "./state";

function harness(overrides: Partial<LiveSelectionRuntimeDeps> = {}) {
  const state = createAppState();
  const channels = [{ name: "Uno" }, { name: "Dos" }];
  const rows = [{ classList: { toggle: () => {} }, _channel: 0 }, { classList: { toggle: () => {} }, _channel: 1 }];
  const container = { scrollTop: 0, scrollHeight: 500, clientHeight: 100 };
  const label = { textContent: null as string | null };
  const calls: string[] = [];
  const deps: LiveSelectionRuntimeDeps = {
    state,
    getChannels: () => channels,
    getRows: () => rows,
    getContainer: () => container,
    getLabel: () => label,
    byId: (id) => (id === "live-cat-label" ? label : null),
    getSelectedCategory: () => ({ name: "Todos" }),
    isFavoritesOnly: () => false,
    getPlayerStage: () => ({}),
    saveProfile: () => calls.push("save"),
    setProfileFavorites: () => calls.push("favs"),
    clampIndex: (index, size) => Math.max(0, Math.min(size - 1, index)),
    formatLabel: (name, fav, count) => `${name}:${fav}:${count}`,
    scrollTop: () => 42,
    refreshPlayerChannels: () => calls.push("refresh"),
    playChannel: () => calls.push("play"),
    previewChannel: () => calls.push("preview"),
    selectFromRuntime: () => false,
    scrollFromRuntime: () => false,
    ...overrides
  };
  return { state, channels, rows, container, label, calls, deps };
}

describe("live selection runtime", () => {
  it("selects a channel, updates label and scroll in home", () => {
    const test = harness();
    test.state.screen = "home";
    test.state.tab = 0;
    const runtime = createLiveSelectionRuntime(test.deps);
    runtime.select(1);
    expect(test.state.channel).toBe(1);
    expect(test.label.textContent).toBe("Dos");
    expect(test.container.scrollTop).toBe(42);
    expect(test.calls).toContain("preview");
  });

  it("plays the channel on the player screen without delegating to home list", () => {
    const selectFromRuntime = vi.fn(() => true);
    const test = harness({ selectFromRuntime });
    test.state.screen = "player";
    test.state.playerMode = "live";
    createLiveSelectionRuntime(test.deps).select(0, true);
    expect(selectFromRuntime).not.toHaveBeenCalled();
    expect(test.calls).toContain("refresh");
    expect(test.calls).toContain("play");
  });

  it("updates category label and syncs favorites", () => {
    const test = harness();
    const runtime = createLiveSelectionRuntime(test.deps);
    runtime.updateLabel();
    expect(test.label.textContent).toBe("Todos:false:2");
    runtime.syncFavorites({ "1": true });
    expect(test.state.favs).toEqual({ "1": true });
    expect(test.calls).toEqual(["favs", "save"]);
  });
});
