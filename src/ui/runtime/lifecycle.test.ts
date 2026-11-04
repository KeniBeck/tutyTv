import { afterEach, describe, expect, it, vi } from "vitest";
import {
  attachAppLifecycle,
  handleLifecycleUnload,
  handleLifecycleVisibilityChange,
  resetAppLifecycleRuntime,
  resumeLifecyclePlayback,
  suspendLifecyclePlayback,
  type LifecycleHost,
  type LifecycleMedia
} from "./lifecycle";

function createHarness() {
  const player: LifecycleMedia = { paused: false };
  const preview: LifecycleMedia = { paused: false };
  let hidden = false;
  const play = vi.fn(() => Promise.resolve());
  const stopPlayback = vi.fn();
  const cleanup = vi.fn();
  const host: LifecycleHost = {
    isHidden: () => hidden,
    getPlayer: () => player,
    getPreview: () => preview,
    play,
    stopPlayback,
    cleanup
  };
  attachAppLifecycle(host);
  return {
    player,
    preview,
    play,
    stopPlayback,
    cleanup,
    setHidden(value: boolean) {
      hidden = value;
    },
    host
  };
}

afterEach(() => {
  resetAppLifecycleRuntime();
  vi.clearAllMocks();
});

describe("app lifecycle", () => {
  it("remembers whether player and preview were playing", () => {
    const harness = createHarness();
    harness.preview.paused = true;

    expect(suspendLifecyclePlayback()).toBe(true);

    harness.player.paused = true;
    harness.preview.paused = false;
    expect(resumeLifecyclePlayback()).toBe(true);
    expect(harness.play).toHaveBeenCalledWith(harness.player);
    expect(harness.play).not.toHaveBeenCalledWith(harness.preview);
  });

  it("resumes both media elements when the browser paused them", () => {
    const harness = createHarness();
    suspendLifecyclePlayback();

    harness.player.paused = true;
    harness.preview.paused = true;
    resumeLifecyclePlayback();

    expect(harness.play).toHaveBeenCalledTimes(2);
    expect(harness.play).toHaveBeenNthCalledWith(1, harness.player);
    expect(harness.play).toHaveBeenNthCalledWith(2, harness.preview);
  });

  it("does not resume media that is still playing or was not playing", () => {
    const harness = createHarness();
    harness.player.paused = false;
    harness.preview.paused = false;
    suspendLifecyclePlayback();
    harness.player.paused = false;
    harness.preview.paused = false;

    resumeLifecyclePlayback();

    expect(harness.play).not.toHaveBeenCalled();
  });

  it("suspends while hidden and resumes when visible", () => {
    const harness = createHarness();
    const suspend = vi.spyOn(harness.host, "isHidden");
    harness.setHidden(true);

    handleLifecycleVisibilityChange();
    expect(suspend).toHaveBeenCalled();
    harness.setHidden(false);
    harness.player.paused = true;
    handleLifecycleVisibilityChange();

    expect(harness.play).toHaveBeenCalledWith(harness.player);
  });

  it("stops playback and runs cleanup on unload", () => {
    const harness = createHarness();

    expect(handleLifecycleUnload()).toBe(true);

    expect(harness.stopPlayback).toHaveBeenCalledTimes(1);
    expect(harness.cleanup).toHaveBeenCalledTimes(1);
  });

  it("ignores play rejections and synchronous failures", async () => {
    const harness = createHarness();
    harness.play.mockReturnValueOnce(Promise.reject(new Error("blocked")));
    suspendLifecyclePlayback();
    harness.player.paused = true;
    expect(() => resumeLifecyclePlayback()).not.toThrow();
    await Promise.resolve();
    expect(harness.play).toHaveBeenCalled();

    harness.play.mockImplementationOnce(() => {
      throw new Error("blocked");
    });
    suspendLifecyclePlayback();
    harness.player.paused = true;
    expect(() => resumeLifecyclePlayback()).not.toThrow();
  });

  it("returns false when the runtime is not attached", () => {
    resetAppLifecycleRuntime();
    expect(suspendLifecyclePlayback()).toBe(false);
    expect(resumeLifecyclePlayback()).toBe(false);
    expect(handleLifecycleVisibilityChange()).toBe(false);
    expect(handleLifecycleUnload()).toBe(false);
  });
});
