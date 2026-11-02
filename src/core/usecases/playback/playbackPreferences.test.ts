import { describe, expect, it } from "vitest";
import { mergePlaybackPreferences } from "./playbackPreferences";

function defaults() {
  return { streamMode: "normal", screen: 0, subtitle: true, audio: 0 };
}

describe("playback preferences", () => {
  it("keeps defaults when nothing is stored", () => {
    expect(mergePlaybackPreferences(defaults(), null)).toEqual(defaults());
    expect(mergePlaybackPreferences(defaults(), undefined)).toEqual(defaults());
  });

  it("merges only keys that already exist and are defined", () => {
    expect(mergePlaybackPreferences(defaults(), {
      streamMode: "smooth",
      screen: 2,
      subtitle: undefined,
      unknown: "ignored"
    })).toEqual({ streamMode: "smooth", screen: 2, subtitle: true, audio: 0 });
  });

  it("keeps falsy stored values", () => {
    const current = { ...defaults(), screen: 2 };
    expect(mergePlaybackPreferences(current, { subtitle: false, screen: 0 })).toEqual({
      streamMode: "normal", screen: 0, subtitle: false, audio: 0
    });
    expect(mergePlaybackPreferences(current, { subtitle: false })).toBe(current);
  });
});
