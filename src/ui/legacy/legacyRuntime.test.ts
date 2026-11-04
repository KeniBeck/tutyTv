import { afterEach, describe, expect, it, vi } from "vitest";
import { createLegacyRuntime } from "./legacyRuntime.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("legacy runtime", () => {
  it("builds service config, aliases and dev service URL", () => {
    const request = vi.fn();
    const requestDev = vi.fn();
    const ensureWebOsService = vi.fn(() => true);
    vi.stubGlobal("window", {
      TUTYTV_API: { baseUrl: "https://api.test" },
      location: { search: "?service=http%3A%2F%2F127.0.0.1%3A8080" },
      TutyUI: {
        createServiceRuntime: () => ({ request, requestDev, ensureWebOsService })
      },
      TutyCore: {
        player: {
          pause() {},
          play() {},
          setSource() {},
          reload() {},
          loadHls() {},
          seekTo() {}
        },
        platform: {
          prefersNativeTvPlayback: () => false,
          canPlayPreviewHls: () => false,
          back() {},
          canUseLunaService: () => true
        },
        destroyLegacyHls() {}
      }
    });
    const runtime = createLegacyRuntime({ canUseLuna: () => true });
    expect(runtime.p.baseUrl).toBe("https://api.test");
    expect(runtime.p.devServiceUrl).toBe("http://127.0.0.1:8080");
    expect(runtime.q).toBe(request);
    expect(runtime.L).toBe(requestDev);
    expect(runtime.E()).toBe(true);
    expect(runtime.serviceRuntime.ensureWebOsService).toBe(ensureWebOsService);
  });
});
