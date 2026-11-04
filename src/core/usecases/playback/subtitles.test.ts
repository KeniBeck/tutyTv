import { describe, expect, it } from "vitest";
import { findSubtitleCue, parseSubtitleCues, parseSubtitleTimestamp } from "./subtitles";

describe("subtitle parsing", () => {
  it("parses timestamps with comma or dot decimals", () => {
    expect(parseSubtitleTimestamp("00:01:02,500")).toBe(62.5);
    expect(parseSubtitleTimestamp("01:02:03.250")).toBe(3723.25);
    expect(parseSubtitleTimestamp("00:00:00,000")).toBe(0);
    expect(parseSubtitleTimestamp("")).toBe(0);
    expect(parseSubtitleTimestamp("12:34")).toBe(0);
  });

  it("parses SRT cues with indexes, CRLF, fonts and multiline text", () => {
    const source = [
      "1",
      "00:00:01,000 --> 00:00:03,500",
      "<font color=\"#fff\">Hola</font>",
      "mundo",
      "",
      "2",
      "00:00:04,000 --> 00:00:06,000",
      "Segunda línea",
      ""
    ].join("\r\n");

    expect(parseSubtitleCues(source)).toEqual([
      { start: 1, end: 3.5, text: "Hola<br>mundo" },
      { start: 4, end: 6, text: "Segunda línea" }
    ]);
  });

  it("finds the active cue at a playback position", () => {
    const cues = [
      { start: 1, end: 3, text: "uno" },
      { start: 4, end: 6, text: "dos" }
    ];
    expect(findSubtitleCue(cues, 2)).toEqual(cues[0]);
    expect(findSubtitleCue(cues, 3)).toEqual(cues[0]);
    expect(findSubtitleCue(cues, 5)).toEqual(cues[1]);
    expect(findSubtitleCue(cues, 3.5)).toBeNull();
    expect(findSubtitleCue(null, 2)).toBeNull();
  });

  it("accepts blocks without an index line and skips malformed cues", () => {
    const source = [
      "00:00:10,000 --> 00:00:12,000",
      "Sin índice",
      "",
      "sin linea de tiempo",
      ""
    ].join("\n");

    expect(parseSubtitleCues(source)).toEqual([
      { start: 10, end: 12, text: "Sin índice" }
    ]);
    expect(parseSubtitleCues("")).toEqual([]);
    expect(parseSubtitleCues(null)).toEqual([]);
  });
});
