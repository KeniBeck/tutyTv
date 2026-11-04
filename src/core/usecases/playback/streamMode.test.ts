import { describe, expect, it } from "vitest";
import { applyRelayResumeStart, isRelayStreamMode, shouldForceRelay } from "./streamMode";

describe("stream mode playback rules", () => {
  it("identifies relay modes", () => {
    expect(isRelayStreamMode("relay")).toBe(true);
    expect(isRelayStreamMode("smooth")).toBe(true);
    expect(isRelayStreamMode("normal")).toBe(false);
    expect(isRelayStreamMode("")).toBe(false);
    expect(isRelayStreamMode("native")).toBe(false);
  });

  it("forces relay for relay modes or resumed playback", () => {
    expect(shouldForceRelay("relay", 0)).toBe(true);
    expect(shouldForceRelay("smooth", 0)).toBe(true);
    expect(shouldForceRelay("normal", 12)).toBe(true);
    expect(shouldForceRelay("normal", 0)).toBe(false);
    expect(shouldForceRelay("normal", -3)).toBe(false);
  });

  it("adds the relay resume start only to relay URLs", () => {
    expect(applyRelayResumeStart("https://example.com/movie.mp4", 42)).toEqual({
      url: "https://example.com/movie.mp4",
      consumed: false
    });
    expect(applyRelayResumeStart("http://127.0.0.1:8787/s/abc123.mp4", 0)).toEqual({
      url: "http://127.0.0.1:8787/s/abc123.mp4",
      consumed: false
    });
    expect(applyRelayResumeStart("http://127.0.0.1:8787/s/abc123.mp4", 12.9)).toEqual({
      url: "http://127.0.0.1:8787/s/abc123.mp4?start=12",
      consumed: true
    });
    expect(applyRelayResumeStart("http://127.0.0.1:8787/s/abc123.mp4?token=1", 5)).toEqual({
      url: "http://127.0.0.1:8787/s/abc123.mp4?token=1&start=5",
      consumed: true
    });
  });
});
