import { describe, expect, it, vi } from "vitest";

vi.mock("./playerSource", () => ({
  getPlayerPosition: () => 120,
  getPlayerPlaybackTotal: () => 1000,
  getPlayerRelayBase: () => "",
  getPlayerRelayOffset: () => 0,
  getPlayerRelayDuration: () => 0,
  setPlayerRelayOffset: vi.fn(),
  setPlayerRelayDuration: vi.fn()
}));

import { createAppState } from "../../runtime/state";
import { attachPlayerControlWiring } from "./playerControlWiring";
import {
  endPlayerScrub,
  resetPlayerTransportRuntime,
  startPlayerScrub
} from "./playerTransport";

describe("player control wiring", () => {
  it("uses the seekbar created after the wiring is attached", () => {
    const state = createAppState();
    let seekbar: { classList: { toggle: ReturnType<typeof vi.fn> } } | null = null;
    const focus = vi.fn();
    attachPlayerControlWiring({
      state,
      getVideo: () => ({ paused: false, currentTime: 120 }),
      getSeekbar: () => seekbar as never,
      getCurrentNode: () => null,
      getTotalNode: () => null,
      getProgressNode: () => null,
      getBufferedNode: () => null,
      getThumbNode: () => null,
      getSubtitleEnd: () => 0,
      clearInfobarTimer: vi.fn(),
      playVideo: vi.fn(),
      pauseVideo: vi.fn(),
      setTransport: vi.fn(),
      showInfobar: vi.fn(),
      scheduleInfobarHide: vi.fn(),
      focus,
      focusPlayer: vi.fn(),
      seekVideo: vi.fn(),
      loadSource: vi.fn(),
      updateProgress: vi.fn()
    });

    expect(startPlayerScrub()).toBe(false);

    seekbar = { classList: { toggle: vi.fn() } };
    expect(startPlayerScrub()).toBe(true);
    expect(focus).toHaveBeenCalledWith(seekbar);
    expect(seekbar.classList.toggle).toHaveBeenCalledWith("is-scrubbing", true);
    expect(endPlayerScrub()).toBe(true);
    expect(seekbar.classList.toggle).toHaveBeenLastCalledWith("is-scrubbing", false);
    resetPlayerTransportRuntime();
  });
});
