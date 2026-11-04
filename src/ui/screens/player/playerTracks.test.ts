import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyPlayerSubtitlePreference,
  applyPlayerSubtitleTracks,
  attachPlayerTracks,
  getCurrentPlayerSubtitle,
  getPlayerMediaInfo,
  getPlayerSubtitleTracks,
  isPlayerSubtitleEnabled,
  loadPlayerMediaInfo,
  resetPlayerTrackSelection,
  resetPlayerTracksRuntime,
  selectPlayerAudioIndex,
  setCurrentPlayerSubtitle,
  setPlayerSubtitleEnabled,
  setPlayerSubtitleForced
} from "./playerTracks";

const state = {
  trackIndex: 5,
  playback: {
    audioCode: "eng",
    audio: 1,
    subtitle: false,
    subCode: "spa",
    subLang: 0
  }
};

function setup() {
  const requestMediaInfo = vi.fn();
  const loadSubtitle = vi.fn();
  attachPlayerTracks({
    state: state as never,
    getMediaKey: (item) => String(item.id || ""),
    getEpisode: (item) => (item.episodes && item.episodes[0]) || null,
    requestMediaInfo,
    loadSubtitle
  });
  return { requestMediaInfo, loadSubtitle };
}

describe("player tracks", () => {
  afterEach(() => {
    resetPlayerTracksRuntime();
    state.playback.subtitle = false;
    state.playback.subCode = "spa";
    state.playback.subLang = 0;
    state.trackIndex = 5;
  });

  it("caches media info and shares pending requests", () => {
    const { requestMediaInfo, loadSubtitle } = setup();
    requestMediaInfo.mockImplementation(() => {});
    const first = vi.fn();
    const second = vi.fn();

    expect(loadPlayerMediaInfo({ id: "ep1", episodes: [{ id: "ep1" }] }, first)).toBe(true);
    expect(loadPlayerMediaInfo({ id: "ep1", episodes: [{ id: "ep1" }] }, second)).toBe(true);
    expect(requestMediaInfo).toHaveBeenCalledTimes(1);
    expect(requestMediaInfo).toHaveBeenCalledWith(
      { contentId: "ep1" },
      expect.any(Function)
    );

    const done = requestMediaInfo.mock.calls[0]?.[1] as ((error: unknown, media: unknown) => void);
    done(null, {
      returnValue: true,
      audio: "spa,eng",
      subtitles: [
        { url: "es.vtt", lang: "spa" },
        { url: "en.vtt", lang: "eng" }
      ]
    });
    expect(first).toHaveBeenCalledWith(expect.objectContaining({ audio: "spa,eng" }));
    expect(second).toHaveBeenCalledWith(expect.objectContaining({ audio: "spa,eng" }));
    expect(getPlayerMediaInfo("ep1")).toEqual(expect.objectContaining({ audio: "spa,eng" }));

    state.playback.subtitle = true;
    loadPlayerMediaInfo({ id: "ep1" });
    expect(requestMediaInfo).toHaveBeenCalledTimes(1);
    expect(loadSubtitle).toHaveBeenCalledWith(expect.objectContaining({ url: "es.vtt" }));
    expect(isPlayerSubtitleEnabled()).toBe(true);
  });

  it("reports missing items and keys without requesting", () => {
    const { requestMediaInfo } = setup();
    const done = vi.fn();

    expect(loadPlayerMediaInfo(null, done)).toBe(false);
    expect(loadPlayerMediaInfo({}, done)).toBe(false);
    expect(done).toHaveBeenCalledWith(null);
    expect(requestMediaInfo).not.toHaveBeenCalled();
  });

  it("selects audio tracks from preferences", () => {
    setup();
    expect(selectPlayerAudioIndex("spa,eng")).toBe(1);
    state.playback.audioCode = "spa";
    expect(selectPlayerAudioIndex("spa,eng")).toBe(0);
  });

  it("keeps forced subtitles and resets selection state", () => {
    const { loadSubtitle } = setup();
    state.playback.subtitle = true;
    setPlayerSubtitleEnabled(true);
    setPlayerSubtitleForced(true);
    expect(applyPlayerSubtitlePreference()).toBe(true);

    const media = {
      subtitles: [
        { url: "es.vtt", lang: "spa" },
        { url: "en.vtt", lang: "eng" }
      ]
    };
    expect(getPlayerSubtitleTracks(media)).toHaveLength(2);

    setCurrentPlayerSubtitle({ url: "en.vtt", lang: "eng" });
    applyPlayerSubtitleTracks(media);
    expect(getCurrentPlayerSubtitle()).toEqual(expect.objectContaining({ url: "en.vtt" }));
    expect(loadSubtitle).not.toHaveBeenCalled();

    setCurrentPlayerSubtitle({ url: "fr.vtt", lang: "fra" });
    applyPlayerSubtitleTracks(media);
    expect(loadSubtitle).toHaveBeenLastCalledWith(expect.objectContaining({ url: "es.vtt" }));

    resetPlayerTrackSelection();
    expect(isPlayerSubtitleEnabled()).toBe(false);
    expect(getCurrentPlayerSubtitle()).toBeNull();
    expect(state.trackIndex).toBe(0);
  });
});
