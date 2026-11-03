import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppState } from "../../runtime/state";
import {
  attachPlayerResolve,
  resetPlayerResolveRuntime,
  resolvePlayerPlayback,
  type PlayerResolveHost,
  type ResolveBuildResult
} from "./playerResolve";

function createHarness() {
  const state = createAppState();
  state.screen = "player";
  state.playerMode = "vod";
  state.streamMode = "normal";
  state.resumePosition = 15;
  state.playerEpisode = { id: "e1", number: 1 } as unknown;
  const item = { id: "series", audio: "es,pt" };
  let sequence = 0;
  let audioIndex = 0;
  let override = false;
  let shouldLoad = false;
  let missing = false;
  const resolveCalls: Array<{
    request: { forceRelay?: boolean };
    forceRelay: boolean;
    done: (error: string | null, response: Record<string, unknown> | null) => void;
  }> = [];
  let pendingDetail: (() => void) | null = null;
  const setStreamInfo = vi.fn();
  const notify = vi.fn();
  const applyResolved = vi.fn(() => ({
    url: "https://cdn/episode.mp4",
    resumePosition: 7,
    streamInfo: { selectedTrack: { index: 1 } }
  }));
  const buildRequest = vi.fn((): ResolveBuildResult => ({
    request: { contentId: "e2", forceRelay: true },
    episode: { id: "e2", number: 2 },
    resumePosition: 11,
    missingEpisodes: missing
  }));
  const host: PlayerResolveHost = {
    state,
    getSequence: () => sequence,
    getMediaInfo: () => ({ audio: "es,pt" }),
    getMediaKey: () => "e1",
    isAudioOverride: () => override,
    getAudioIndex: () => audioIndex,
    setAudioIndex: (index) => {
      audioIndex = index;
    },
    selectAudioTrack: () => 1,
    buildRequest,
    isSeries: () => true,
    shouldLoadEpisodes: () => shouldLoad,
    loadSeriesDetail: (_item, done) => {
      pendingDetail = done;
    },
    resolve: (request, forceRelay, done) => {
      resolveCalls.push({ request, forceRelay, done });
    },
    applyResolved,
    setStreamInfo,
    notify
  };
  attachPlayerResolve(host);
  return {
    state,
    item,
    host,
    resolveCalls,
    setStreamInfo,
    notify,
    applyResolved,
    buildRequest,
    get audioIndex() {
      return audioIndex;
    },
    setOverride(value: boolean) {
      override = value;
    },
    setShouldLoad(value: boolean) {
      shouldLoad = value;
    },
    setMissing(value: boolean) {
      missing = value;
    },
    bumpSequence() {
      sequence += 1;
    },
    respondDetail() {
      pendingDetail?.();
    }
  };
}

afterEach(() => {
  resetPlayerResolveRuntime();
  vi.clearAllMocks();
});

describe("playerResolve", () => {
  it("selects the preferred audio, resolves and applies stream metadata", () => {
    const harness = createHarness();
    const done = vi.fn();

    expect(resolvePlayerPlayback(harness.item, done)).toBe(true);

    expect(harness.audioIndex).toBe(1);
    expect(harness.buildRequest).toHaveBeenCalledWith(
      harness.item,
      { id: "e1", number: 1 },
      {
        streamMode: "normal",
        resumePosition: 15,
        trackIndex: 0,
        audioTrack: 1,
        isSeries: true
      }
    );
    expect(harness.state.playerEpisode).toEqual({ id: "e2", number: 2 });
    expect(harness.state.resumePosition).toBe(11);

    harness.resolveCalls[0]?.done(null, { returnValue: true, proxyPath: "x" });

    expect(harness.applyResolved).toHaveBeenCalledWith(
      harness.item,
      { id: "e2", number: 2 },
      { returnValue: true, proxyPath: "x" },
      15
    );
    expect(harness.setStreamInfo).toHaveBeenCalledWith({ selectedTrack: { index: 1 } });
    expect(harness.state.resumePosition).toBe(7);
    expect(done).toHaveBeenCalledWith("https://cdn/episode.mp4");
  });

  it("keeps the manual audio override", () => {
    const harness = createHarness();
    harness.setOverride(true);

    resolvePlayerPlayback(harness.item, vi.fn());

    expect(harness.audioIndex).toBe(0);
  });

  it("retries without forceRelay when the smooth resolver fails", () => {
    const harness = createHarness();
    resolvePlayerPlayback(harness.item, vi.fn());

    harness.resolveCalls[0]?.done("smooth failed", null);
    expect(harness.resolveCalls[0]?.request.forceRelay).toBe(false);
    expect(harness.resolveCalls[1]?.forceRelay).toBe(false);

    harness.resolveCalls[1]?.done(null, { returnValue: true });
    expect(harness.applyResolved).toHaveBeenCalledTimes(1);
  });

  it("reports resolver failures and clears the resume position", () => {
    const harness = createHarness();
    const done = vi.fn();
    resolvePlayerPlayback(harness.item, done);

    harness.resolveCalls[0]?.done("network", null);
    harness.resolveCalls[1]?.done("network", null);

    expect(harness.state.resumePosition).toBe(0);
    expect(harness.state.streamError).toBe("No se pudo resolver el título: network");
    expect(harness.notify).toHaveBeenLastCalledWith("No se pudo resolver el título: network");
    expect(done).toHaveBeenCalledWith("");
  });

  it("ignores responses from a stale playback sequence", () => {
    const harness = createHarness();
    const done = vi.fn();
    resolvePlayerPlayback(harness.item, done);
    harness.bumpSequence();

    harness.resolveCalls[0]?.done(null, { returnValue: true });

    expect(harness.applyResolved).not.toHaveBeenCalled();
    expect(done).not.toHaveBeenCalled();
  });

  it("stops when episodes are missing", () => {
    const harness = createHarness();
    const done = vi.fn();
    harness.setMissing(true);

    resolvePlayerPlayback(harness.item, done);

    expect(done).toHaveBeenCalledWith("");
    expect(harness.resolveCalls).toHaveLength(0);
  });

  it("loads series details before resolving when needed", () => {
    const harness = createHarness();
    harness.setShouldLoad(true);

    resolvePlayerPlayback(harness.item, vi.fn());

    expect(harness.notify).toHaveBeenCalledWith("Cargando capítulos…");
    expect(harness.resolveCalls).toHaveLength(0);

    harness.respondDetail();

    expect(harness.resolveCalls).toHaveLength(1);
  });

  it("returns false without a runtime or item", () => {
    expect(resolvePlayerPlayback({ id: "x" }, vi.fn())).toBe(false);
    const harness = createHarness();
    expect(resolvePlayerPlayback(null, vi.fn())).toBe(false);
    resetPlayerResolveRuntime();
    expect(resolvePlayerPlayback(harness.item, vi.fn())).toBe(false);
  });
});
