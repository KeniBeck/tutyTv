import { afterEach, describe, expect, it, vi } from "vitest";
import {
  attachWebOsKeepAlive,
  resetWebOsKeepAliveRuntime,
  startWebOsKeepAlive,
  stopWebOsKeepAlive,
  type WebOsKeepAliveBridge,
  type WebOsKeepAliveHost
} from "./webOsKeepAlive";

function createHarness() {
  let canUse = true;
  let bridge: WebOsKeepAliveBridge | null = {
    request: vi.fn()
  };
  const host: WebOsKeepAliveHost = {
    canUseLuna: () => canUse,
    getServiceId: () => "com.example.service",
    getBridge: () => bridge
  };
  attachWebOsKeepAlive(host);
  return {
    host,
    get bridge() {
      return bridge;
    },
    setCanUse(value: boolean) {
      canUse = value;
    },
    setBridge(value: WebOsKeepAliveBridge | null) {
      bridge = value;
    }
  };
}

afterEach(() => {
  resetWebOsKeepAliveRuntime();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("webOS keepAlive", () => {
  it("subscribes to keepAlive and sends a heartbeat every 15 seconds", () => {
    vi.useFakeTimers();
    const harness = createHarness();
    const request = harness.bridge?.request as ReturnType<typeof vi.fn>;

    expect(startWebOsKeepAlive()).toBe(true);

    expect(request).toHaveBeenCalledWith("luna://com.example.service", {
      method: "keepAlive",
      parameters: { subscribe: true },
      resubscribe: true,
      onSuccess: expect.any(Function),
      onFailure: expect.any(Function)
    });

    vi.advanceTimersByTime(14999);
    expect(request).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(request).toHaveBeenLastCalledWith("luna://com.example.service", {
      method: "heartbeat",
      parameters: {},
      onSuccess: expect.any(Function),
      onFailure: expect.any(Function)
    });
    vi.advanceTimersByTime(15000);
    expect(request).toHaveBeenCalledTimes(3);
  });

  it("uses the default service id when none is configured", () => {
    vi.useFakeTimers();
    const harness = createHarness();
    const request = harness.bridge?.request as ReturnType<typeof vi.fn>;
    vi.spyOn(harness.host, "getServiceId").mockReturnValue("");

    startWebOsKeepAlive();

    expect(request).toHaveBeenCalledWith(
      "luna://com.webosflux.xuptertv.fidelity.service",
      expect.any(Object)
    );
  });

  it("keeps the heartbeat active when the initial request throws", () => {
    vi.useFakeTimers();
    const harness = createHarness();
    const request = vi.fn(() => {
      throw new Error("unavailable");
    });
    harness.setBridge({ request });

    expect(() => startWebOsKeepAlive()).not.toThrow();
    expect(() => vi.advanceTimersByTime(15000)).not.toThrow();
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("does not start without Luna or a bridge", () => {
    const harness = createHarness();
    harness.setCanUse(false);
    expect(startWebOsKeepAlive()).toBe(false);
    harness.setCanUse(true);
    harness.setBridge(null);
    expect(startWebOsKeepAlive()).toBe(false);
  });

  it("restarts cleanly without duplicating heartbeats", () => {
    vi.useFakeTimers();
    const harness = createHarness();
    const request = harness.bridge?.request as ReturnType<typeof vi.fn>;

    startWebOsKeepAlive();
    startWebOsKeepAlive();
    vi.advanceTimersByTime(15000);

    expect(request.mock.calls.filter(([uri, options]) =>
      (options as { method?: string }).method === "heartbeat"
    )).toHaveLength(1);
  });

  it("stops the heartbeat explicitly or on reset", () => {
    vi.useFakeTimers();
    const harness = createHarness();
    startWebOsKeepAlive();
    expect(stopWebOsKeepAlive()).toBe(true);
    vi.advanceTimersByTime(30000);
    expect(harness.bridge?.request).toHaveBeenCalledTimes(1);

    startWebOsKeepAlive();
    resetWebOsKeepAliveRuntime();
    vi.advanceTimersByTime(30000);
    expect(harness.bridge?.request).toHaveBeenCalledTimes(2);
  });
});
