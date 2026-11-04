import { afterEach, describe, expect, it, vi } from "vitest";
const relay = vi.hoisted(() => ({ base: "", offset: 0, duration: 0 }));
vi.mock("./playerSource", () => ({
  getPlayerRelayBase: () => relay.base,
  getPlayerRelayOffset: () => relay.offset,
  getPlayerRelayDuration: () => relay.duration
}));

import {
  attachPlayerProgress,
  resetPlayerProgressRuntime,
  updatePlayerProgress
} from "./playerProgress";


function element() {
  return { textContent: "", style: { width: "", left: "" } };
}

describe("player progress", () => {
  afterEach(() => {
    resetPlayerProgressRuntime();
    relay.base = "";
    relay.offset = 0;
    relay.duration = 0;
  });

  function setup() {
    const current = element();
    const total = element();
    const progress = element();
    const buffered = element();
    const thumb = element();
    const nodes = {
      current,
      total,
      progress,
      buffered,
      thumb,
      episodeDuration: 0,
      itemDuration: 0,
      inferredDuration: 0,
      subtitleEnd: 0,
      series: false,
      scrubbing: false,
      scrubPosition: 0,
      pendingSeek: false,
      duration: 3600,
      bufferedEnd: 0
    };
    attachPlayerProgress({
      state: {} as never,
      getVideo: () => ({
        duration: nodes.duration,
        buffered: { length: 1, end: () => nodes.bufferedEnd }
      }),
      getCurrentNode: () => current,
      getTotalNode: () => total,
      getProgressNode: () => progress,
      getBufferedNode: () => buffered,
      getThumbNode: () => thumb,
      getEpisodeDuration: () => nodes.episodeDuration,
      getItemDuration: () => nodes.itemDuration,
      getInferredDuration: () => nodes.inferredDuration,
      getSubtitleEnd: () => nodes.subtitleEnd,
      isSeries: () => nodes.series,
      isScrubbing: () => nodes.scrubbing,
      getScrubPosition: () => nodes.scrubPosition,
      hasPendingSeek: () => nodes.pendingSeek
    });
    return nodes;
  }

  it("uses the absolute relay duration for the seek bar", () => {
    const nodes = setup();
    nodes.itemDuration = 7200;

    updatePlayerProgress(90, 5400);
    expect(nodes.current.textContent).toBe("00:01:30");
    expect(nodes.total.textContent).toBe("01:30:00");
    expect(nodes.progress.style.width).toBe("1.67%");

    relay.base = "http://127.0.0.1:8787/s/abc.mp4";
    relay.offset = 1800;
    updatePlayerProgress(1890, 3600);
    expect(nodes.current.textContent).toBe("00:31:30");
    expect(nodes.total.textContent).toBe("02:00:00");
    expect(nodes.progress.style.width).toBe("26.25%");

    nodes.itemDuration = 0;
    nodes.episodeDuration = 2700;
    updatePlayerProgress(1890, 3600);
    expect(nodes.total.textContent).toBe("00:45:00");
    expect(nodes.progress.style.width).toBe("70.00%");

    updatePlayerProgress(300, 3600);
    expect(nodes.current.textContent).toBe("00:05:00");
  });

  it("refreshes the buffered bar with the relay offset", () => {
    const nodes = setup();
    nodes.bufferedEnd = 1800;
    nodes.duration = 3600;

    updatePlayerProgress(90, 3600);
    expect(nodes.buffered.style.width).toBe("50.00%");

    nodes.bufferedEnd = 0;
    updatePlayerProgress(90, 3600);
    expect(nodes.buffered.style.width).toBe("0.00%");
  });

  it("uses the scrub preview while a seek is pending", () => {
    const nodes = setup();
    nodes.scrubbing = true;
    nodes.scrubPosition = 120;

    updatePlayerProgress(300, 2900);
    expect(nodes.current.textContent).toBe("00:05:00");

    nodes.pendingSeek = true;
    updatePlayerProgress(300, 2900);
    expect(nodes.current.textContent).toBe("00:02:00");
  });
});
