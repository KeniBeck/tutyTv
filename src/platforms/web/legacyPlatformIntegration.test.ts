import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");
const service = source.match(/ {4}function E\(\) \{[\s\S]*?(?= {4}function O\(e\))/)?.[0];
const helpers = source.match(/ {4}function legacyNavigationAction\(e\) \{[\s\S]*?(?= {4}function Q\(\))/)?.[0];

describe("legacy platform integration", () => {
  it.each([true, false])("preserves Luna, web fallback, back and preview capabilities (core available: %s)", (withCore) => {
    expect(service && helpers).toBeTruthy();
    const calls: Array<{ uri: string; params: string }> = [];
    class PalmServiceBridge {
      onservicecallback: ((data: string) => void) | null = null;
      call(uri: string, params: string) {
        calls.push({ uri, params });
        this.onservicecallback?.('{"returnValue":true,"source":"luna"}');
      }
    }
    const webBack = vi.fn();
    const palmBack = vi.fn();
    const exposedPlatform = {
      ...core.platform,
      canUseLunaService: vi.fn(core.platform.canUseLunaService),
      canPlayPreviewHls: vi.fn(core.platform.canPlayPreviewHls),
      back: vi.fn(core.platform.back)
    };
    const window: Record<string, unknown> = {
      TutyCore: withCore ? { ...core, platform: exposedPlatform } : undefined,
      PalmServiceBridge, webOSTV: { platformBack: webBack }, PalmSystem: { platformBack: palmBack }
    };
    const webRequest = vi.fn((_url: string, callback: (error: null, result: object) => void) => callback(null, { source: "web" }));
    const runtime = runInNewContext(`${helpers}\n${service}\n({ q, legacyPlatformBack, legacyNativePreviewHls })`, {
      window, p: { serviceId: "service.test", devServiceUrl: "http://localhost:8910", timeoutMs: 1000 },
      L: webRequest
    }) as {
      q(method: string, params: object, callback: (error: unknown, result: unknown) => void): boolean;
      legacyPlatformBack(): void;
      legacyNativePreviewHls(video: object): boolean;
    };
    const callback = vi.fn();
    expect(runtime.q("home", { page: 1 }, callback)).toBe(true);
    expect(calls).toEqual([{ uri: "luna://service.test/home", params: '{"page":1}' }]);
    expect(JSON.stringify(callback.mock.calls[0]?.[1])).toBe('{"returnValue":true,"source":"luna"}');
    expect(webRequest).not.toHaveBeenCalled();

    delete window.PalmServiceBridge;
    expect(runtime.q("home", { page: 2 }, callback)).toBe(true);
    expect(webRequest).toHaveBeenCalledOnce();
    expect(webRequest.mock.calls[0]?.[0]).toBe("http://localhost:8910/home?page=2");
    runtime.legacyPlatformBack();
    expect(webBack).toHaveBeenCalledOnce();
    expect(palmBack).not.toHaveBeenCalled();
    delete window.webOSTV;
    runtime.legacyPlatformBack();
    expect(palmBack).toHaveBeenCalledOnce();
    const canPlayType = vi.fn(() => "maybe");
    expect(runtime.legacyNativePreviewHls({ canPlayType })).toBe(true);
    expect(canPlayType).toHaveBeenCalledWith("application/vnd.apple.mpegurl");
    expect(runtime.legacyNativePreviewHls({})).toBe(false);
    expect(exposedPlatform.canUseLunaService).toHaveBeenCalledTimes(withCore ? 2 : 0);
    expect(exposedPlatform.back).toHaveBeenCalledTimes(withCore ? 2 : 0);
    expect(exposedPlatform.canPlayPreviewHls).toHaveBeenCalledTimes(withCore ? 2 : 0);
  });
});
