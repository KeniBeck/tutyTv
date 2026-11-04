import { describe, expect, it } from "vitest";
import { createAppState } from "./state";

describe("createAppState", () => {
  it("starts on welcome with the legacy defaults", () => {
    const state = createAppState();
    expect(state.screen).toBe("welcome");
    expect(state.tab).toBe(0);
    expect(state.infobar).toBe(true);
    expect(state.playback).toEqual({
      streamMode: "normal",
      streamModes: {},
      screen: 0,
      audio: 0,
      audioCode: "",
      subLang: 0,
      subCode: "",
      size: 0,
      style: 0,
      subtitle: true
    });
  });

  it("returns independent state objects", () => {
    const first = createAppState();
    const second = createAppState();
    first.favs.a = true;
    first.playback.audio = 2;
    first.playback.streamModes.title = true;
    expect(second.favs).toEqual({});
    expect(second.playback.audio).toBe(0);
    expect(second.playback.streamModes).toEqual({});
  });
});
