import { describe, expect, it } from "vitest";
import {
  chooseSubtitleTrack,
  describeLanguageLabel,
  normalizeSubtitleTracks,
  parseAudioTracks,
  selectAudioTrackIndex,
  splitTrackCodes
} from "./mediaTracks";

describe("media tracks", () => {
  it("splits codes and selects an audio track by code or preference", () => {
    expect(splitTrackCodes("spa, eng/jpn")).toEqual(["spa", "eng", "jpn"]);
    expect(selectAudioTrackIndex("spa,eng", "eng", 0)).toBe(1);
    expect(selectAudioTrackIndex("spa,eng", "", 2)).toBe(1);
    expect(selectAudioTrackIndex("spa,eng", "missing", 0)).toBe(0);
  });

  it("normalizes subtitles and sorts Spanish first", () => {
    expect(normalizeSubtitleTracks({
      subtitles: [
        { lang: "eng", url: "en.vtt", format: "vtt" },
        { lang: "spa", url: "es.vtt", format: "srt" },
        { lang: "jpn", url: "ja.vtt" }
      ]
    })).toEqual([
      { lang: "spa", url: "es.vtt", format: "srt" },
      { lang: "eng", url: "en.vtt", format: "vtt" },
      { lang: "jpn", url: "ja.vtt", format: undefined }
    ]);
    expect(normalizeSubtitleTracks(null)).toEqual([]);
  });

  it("chooses a subtitle by code or preference and falls back to the first", () => {
    const tracks = [{ lang: "spa", url: "es.vtt" }, { lang: "eng", url: "en.vtt" }];
    expect(chooseSubtitleTrack(tracks, "eng", 0)).toEqual(tracks[1]);
    expect(chooseSubtitleTrack(tracks, "missing", 1)).toEqual(tracks[0]);
    expect(chooseSubtitleTrack([], "spa", 0)).toBeNull();
  });

  it("parses audio tracks and labels languages", () => {
    expect(parseAudioTracks("spa, eng, jpn")).toEqual([
      { index: 0, code: "spa", label: "Español" },
      { index: 1, code: "eng", label: "Inglés" },
      { index: 2, code: "jpn", label: "Japonés" }
    ]);
    expect(parseAudioTracks("")).toEqual([]);
    expect(describeLanguageLabel("deu")).toBe("Alemán");
    expect(describeLanguageLabel("xx")).toBe("Xx");
    expect(describeLanguageLabel("")).toBe("Pista");
  });
});
