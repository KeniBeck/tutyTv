import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppState } from "../../runtime/state";
import {
  attachPlayerLive,
  playLiveChannel,
  resetPlayerLiveRuntime,
  type LivePlaybackChannel,
  type PlayerLiveHost
} from "./playerLive";

function createHarness() {
  const state = createAppState();
  state.screen = "player";
  state.playerMode = "live";
  const channel: LivePlaybackChannel = { channelCode: "c1", name: "Canal Uno" };
  let sequence = 0;
  let pending:
    | ((error: string | null, response: Record<string, unknown> | null) => void)
    | null = null;
  const notify = vi.fn();
  const showInfobar = vi.fn();
  const loadSource = vi.fn();
  const resolveLive = vi.fn(
    (_channel: LivePlaybackChannel, done: typeof pending) => {
      pending = done;
    }
  );
  const host: PlayerLiveHost = {
    state,
    getCurrentChannel: () => channel,
    getSequence: () => sequence,
    nextSequence: () => {
      sequence += 1;
      return sequence;
    },
    resolveDelay: () => 180,
    resolveLive,
    notify,
    showInfobar,
    loadSource
  };
  attachPlayerLive(host);
  return {
    state,
    channel,
    host,
    resolveLive,
    notify,
    showInfobar,
    loadSource,
    get sequence() {
      return sequence;
    },
    bumpSequence() {
      sequence += 1;
    },
    respond(error: string | null, response: Record<string, unknown> | null) {
      pending?.(error, response);
    }
  };
}

afterEach(() => {
  resetPlayerLiveRuntime();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("playerLive", () => {
  it("delays signal resolution and loads the resolved channel", () => {
    vi.useFakeTimers();
    const harness = createHarness();

    expect(playLiveChannel(harness.channel)).toBe(true);
    expect(harness.resolveLive).not.toHaveBeenCalled();
    vi.advanceTimersByTime(179);
    expect(harness.resolveLive).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(harness.notify).toHaveBeenCalledWith("Cargando señal Canal Uno…");
    expect(harness.resolveLive).toHaveBeenCalledWith(harness.channel, expect.any(Function));

    harness.respond(null, { returnValue: true, proxyPath: "http://stream" });

    expect(harness.notify).toHaveBeenLastCalledWith("");
    expect(harness.showInfobar).toHaveBeenCalledTimes(1);
    expect(harness.loadSource).toHaveBeenCalledWith("http://stream");
  });

  it("resolves immediately when requested and falls back to the current channel", () => {
    const harness = createHarness();

    playLiveChannel(null, true);

    expect(harness.resolveLive).toHaveBeenCalledWith(harness.channel, expect.any(Function));
  });

  it("reports resolution failures", () => {
    const harness = createHarness();
    playLiveChannel(harness.channel, true);

    harness.respond("timeout", null);

    expect(harness.state.streamError).toBe("No se pudo conectar con la señal: timeout");
    expect(harness.notify).toHaveBeenLastCalledWith(harness.state.streamError);
    expect(harness.loadSource).not.toHaveBeenCalled();
  });

  it("reports a missing stream url", () => {
    const harness = createHarness();
    playLiveChannel(harness.channel, true);

    harness.respond(null, { returnValue: false });

    expect(harness.state.streamError).toBe("No se pudo conectar con la señal");
    expect(harness.loadSource).not.toHaveBeenCalled();
  });

  it("ignores stale signal responses", () => {
    const harness = createHarness();
    playLiveChannel(harness.channel, true);
    harness.bumpSequence();

    harness.respond(null, { returnValue: true, url: "http://stale" });

    expect(harness.loadSource).not.toHaveBeenCalled();
    expect(harness.showInfobar).not.toHaveBeenCalled();
  });


  it("invalidates an older resolution as soon as a new channel is requested", () => {
    const harness = createHarness();
    playLiveChannel({ channelCode: "a", name: "A" }, true);
    const first = harness.resolveLive.mock.calls[0]?.[1] as (error: string | null, response: Record<string, unknown> | null) => void;
    playLiveChannel({ channelCode: "b", name: "B" }, true);
    const second = harness.resolveLive.mock.calls[1]?.[1] as (error: string | null, response: Record<string, unknown> | null) => void;

    first(null, { returnValue: true, url: "http://a" });
    expect(harness.loadSource).not.toHaveBeenCalled();
    second(null, { returnValue: true, url: "http://b" });
    expect(harness.loadSource).toHaveBeenCalledWith("http://b");
  });

  it("cancels a pending delayed resolution on reset", () => {
    vi.useFakeTimers();
    createHarness();
    playLiveChannel({ channelCode: "c1" }, false);
    resetPlayerLiveRuntime();
    vi.advanceTimersByTime(500);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("returns false for an invalid channel or missing runtime", () => {
    expect(playLiveChannel({ name: "sin fuente" }, true)).toBe(false);
    const harness = createHarness();
    resetPlayerLiveRuntime();
    expect(playLiveChannel(harness.channel, true)).toBe(false);
  });
});
