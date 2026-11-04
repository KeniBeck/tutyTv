import { describe, expect, it, vi } from "vitest";
import { createDetailRuntime, type DetailItem, type DetailRuntimeDeps } from "./detailRuntime";
import { createAppState } from "./state";

function harness(overrides: Partial<DetailRuntimeDeps> = {}) {
  const state = createAppState();
  const calls: string[] = [];
  const deps: DetailRuntimeDeps = {
    state,
    byId: () => ({ classList: { add: () => {} } }),
    focus: () => calls.push("focus"),
    getDetailFocusable: () => null,
    getPlayerStage: () => null,
    findHistory: () => null,
    syncMediaInfo: () => calls.push("sync"),
    resetPlayerItem: () => calls.push("reset-item"),
    prepareItem: () => calls.push("prepare"),
    refreshMediaInfo: () => calls.push("media"),
    renderDetail: () => calls.push("render"),
    showScreen: (name) => calls.push(`screen:${name}`),
    ensurePlayerStage: () => calls.push("stage"),
    notifyStatus: (message) => calls.push(`notify:${message}`),
    loadDetail: (_item, done) => done(_item),
    askResume: (_item, _episode, _position, _duration, done) => {
      done(true);
      return true;
    },
    resetStream: () => calls.push("reset-stream"),
    startPlayback: () => calls.push("play"),
    isSeries: () => false,
    log: () => {},
    ...overrides
  };
  return { state, calls, deps };
}

describe("detail runtime", () => {
  it("opens detail, prepares playback and starts immediately when loaded", () => {
    const test = harness();
    const item: DetailItem = { id: "movie", title: "Pelicula", _detailsLoaded: true };
    createDetailRuntime(test.deps).open(item);
    expect(test.state.screen).not.toBe("detail");
    expect(test.calls).toContain("screen:detail");
    expect(test.calls).toContain("stage");
    expect(test.calls).toContain("play");
    expect(test.state.detail).toBe(item);
  });

  it("asks to resume when history position is available", () => {
    const askResume = vi.fn((_item, _episode, _position, _duration, done: (value: boolean) => void) => {
      done(true);
      return true;
    });
    const test = harness({
      findHistory: () => ({ position: 50, duration: 100, episodeId: "e1" }),
      askResume
    });
    const item: DetailItem = { id: "series", _detailsLoaded: true, episodes: [{ id: "e1" }] };
    test.state.detailEpisode = { id: "e1" };
    createDetailRuntime(test.deps).start(item);
    expect(askResume).toHaveBeenCalled();
    expect(test.calls).toContain("reset-stream");
    expect(test.state.resumePosition).toBe(50);
    expect(test.calls).toContain("play");
  });
});
