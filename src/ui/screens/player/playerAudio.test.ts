import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppState } from "../../runtime/state";
import {
  attachPlayerAudio,
  renderAudioTracks,
  resetPlayerAudioRuntime,
  selectAudioTrack,
  type AudioButtonNode,
  type PlayerAudioHost
} from "./playerAudio";

function createHarness() {
  const state = createAppState();
  state.screen = "player";
  state.playerMode = "vod";
  state.playback.audio = 0;
  const children: AudioButtonNode[] = [];
  const options = {
    appendChild(node: AudioButtonNode) {
      children.push(node);
    }
  };
  const clear = vi.fn(() => {
    children.length = 0;
  });
  let selectedIndex = 0;
  let override = false;
  const host: PlayerAudioHost = {
    state,
    getOptions: () => options,
    clear,
    getMediaAudio: () => "es,pt",
    isAudioOverride: () => override,
    getSelectedIndex: () => selectedIndex,
    setSelectedIndex: vi.fn((index: number) => {
      selectedIndex = index;
    }),
    setAudioOverride: vi.fn((value: boolean) => {
      override = value;
    }),
    parseTracks: () => [
      { index: 0, code: "es", label: "Español" },
      { index: 1, code: "pt", label: "Portugués" }
    ],
    describeTrack: (code) => String(code || "Pista"),
    selectIndex: vi.fn(() => 1),
    languagePreference: vi.fn(() => 1),
    savePreferences: vi.fn(),
    isPlayerScreen: () => true,
    hasMedia: () => true,
    getRelaySource: () => "",
    absolutePosition: () => 120,
    loadUrl: vi.fn(),
    ensureRelayMode: vi.fn(),
    reloadResolved: vi.fn(),
    closeSettings: vi.fn(),
    el: (tag, className, text) => ({
      textContent: text || "",
      classList: { add: vi.fn() },
      _activate: null
    })
  };
  attachPlayerAudio(host);
  return { state, host, options, children, clear };
}

afterEach(() => {
  resetPlayerAudioRuntime();
  vi.clearAllMocks();
});

describe("playerAudio", () => {
  it("renders tracks and marks the selected one", () => {
    const harness = createHarness();

    expect(renderAudioTracks()).toBe(true);

    expect(harness.host.selectIndex).toHaveBeenCalledWith("es,pt");
    expect(harness.host.setSelectedIndex).toHaveBeenCalledWith(1);
    expect(harness.children).toHaveLength(2);
    expect(harness.children[0]?.textContent).toBe("Español");
    expect(harness.children[1]?.textContent).toBe("Portugués");
    expect(harness.children[1]?.classList.add).toHaveBeenCalledWith("is-selected");
    expect(harness.children[0]?.classList.add).not.toHaveBeenCalledWith("is-selected");
  });

  it("does not auto-select while the user has chosen a track", () => {
    const harness = createHarness();
    vi.spyOn(harness.host, "isAudioOverride").mockReturnValue(true);

    renderAudioTracks();

    expect(harness.host.selectIndex).not.toHaveBeenCalled();
    expect(harness.host.setSelectedIndex).not.toHaveBeenCalled();
  });

  it("selects a track, saves preferences and reloads the stream", () => {
    const harness = createHarness();

    expect(selectAudioTrack(1, "pt")).toBe(true);

    expect(harness.host.setSelectedIndex).toHaveBeenCalledWith(1);
    expect(harness.host.setAudioOverride).toHaveBeenCalledWith(true);
    expect(harness.state.playback.audioCode).toBe("pt");
    expect(harness.state.playback.audio).toBe(1);
    expect(harness.host.savePreferences).toHaveBeenCalledTimes(1);
    expect(harness.host.ensureRelayMode).toHaveBeenCalledTimes(1);
    expect(harness.host.reloadResolved).toHaveBeenCalledTimes(1);
    expect(harness.host.closeSettings).toHaveBeenCalledTimes(1);
  });

  it("reloads a relay stream at the current position with the audio index", () => {
    const harness = createHarness();
    vi.spyOn(harness.host, "getRelaySource").mockReturnValue("http://127.0.0.1:8787/s/abc.mp4");

    selectAudioTrack(2, "en");

    expect(harness.host.loadUrl).toHaveBeenCalledWith(
      "http://127.0.0.1:8787/s/abc.mp4?start=120&a=2"
    );
    expect(harness.host.reloadResolved).not.toHaveBeenCalled();
    expect(harness.host.ensureRelayMode).not.toHaveBeenCalled();
  });

  it("falls back to a single Spanish track without media metadata", () => {
    const harness = createHarness();
    vi.spyOn(harness.host, "getMediaAudio").mockReturnValue(undefined);
    vi.spyOn(harness.host, "parseTracks").mockReturnValue([]);

    renderAudioTracks();

    expect(harness.children).toHaveLength(1);
    expect(harness.children[0]?.textContent).toBe("Español");
  });

  it("invokes selection from the rendered action", () => {
    const harness = createHarness();
    renderAudioTracks();

    harness.children[0]?._activate?.();

    expect(harness.host.setSelectedIndex).toHaveBeenLastCalledWith(0);
    expect(harness.host.reloadResolved).toHaveBeenCalledTimes(1);
  });

  it("returns false when the settings list or runtime is unavailable", () => {
    const harness = createHarness();
    vi.spyOn(harness.host, "getOptions").mockReturnValue(null);
    expect(renderAudioTracks()).toBe(false);
    resetPlayerAudioRuntime();
    expect(renderAudioTracks()).toBe(false);
    expect(selectAudioTrack(0, "es")).toBe(false);
  });
});
