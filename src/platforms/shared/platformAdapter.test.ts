import { describe, expect, it, vi } from "vitest";
import { createPlatformAdapter, detectPlatformCapabilities } from "./platformAdapter";

describe("detectPlatformCapabilities", () => {
  it("detects webOS through the user agent", () => {
    const capabilities = detectPlatformCapabilities({
      userAgent: "Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36",
      canPlayType: (mime) => (mime === "application/vnd.apple.mpegurl" ? "probably" : ""),
      hasMediaSource: true
    });

    expect(capabilities).toEqual({
      isWebOS: true,
      supportsNativeHls: true,
      supportsMse: true
    });
  });

  it("detects webOS through PalmSystem", () => {
    expect(
      detectPlatformCapabilities({ hasPalmSystem: true, userAgent: "Mozilla/5.0" }).isWebOS
    ).toBe(true);
  });

  it("reports no native HLS on desktop browsers", () => {
    const capabilities = detectPlatformCapabilities({
      userAgent: "Mozilla/5.0 (X11; Linux x86_64) Chrome/120",
      canPlayType: () => "",
      hasMediaSource: true
    });

    expect(capabilities.isWebOS).toBe(false);
    expect(capabilities.supportsNativeHls).toBe(false);
    expect(capabilities.supportsMse).toBe(true);
  });
});

describe("createPlatformAdapter", () => {
  it("exposes capabilities through the contract", () => {
    const adapter = createPlatformAdapter({ hasMediaSource: true });

    expect(adapter.capabilities().supportsMse).toBe(true);
  });

  it("preserves the legacy TV user-agent rule for playback", () => {
    for (const userAgent of ["webOS", "SMARTTV", "Large Screen"]) {
      expect(createPlatformAdapter({ userAgent }).prefersNativeTvPlayback()).toBe(true);
    }
    expect(createPlatformAdapter({ userAgent: "Web0S" }).prefersNativeTvPlayback()).toBe(false);
    expect(createPlatformAdapter({ userAgent: "desktop" }).prefersNativeTvPlayback()).toBe(false);
  });

  it("preserves service, preview and platform-back capability decisions", () => {
    const adapter = createPlatformAdapter();
    expect(adapter.canUseLunaService(null)).toBe(false);
    expect(adapter.canUseLunaService({})).toBe(true);
    const canPlayType = vi.fn(() => "maybe");
    expect(adapter.canPlayPreviewHls({ canPlayType })).toBe(true);
    expect(canPlayType).toHaveBeenCalledWith("application/vnd.apple.mpegurl");
    expect(adapter.canPlayPreviewHls({})).toBe(false);
    const webBack = vi.fn();
    const palmBack = vi.fn();
    adapter.platformBack({ webOSTV: { platformBack: webBack }, PalmSystem: { platformBack: palmBack } });
    expect(webBack).toHaveBeenCalledOnce();
    expect(palmBack).not.toHaveBeenCalled();
    adapter.platformBack({ PalmSystem: { platformBack: palmBack } });
    expect(palmBack).toHaveBeenCalledOnce();
  });
});
