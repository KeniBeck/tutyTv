import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");
const timestamp = source.match(/ {4}function legacyParseSubtitleTimestamp\(value\) \{[\s\S]*?(?= {4}function legacyParseSubtitleCues)/)?.[0];
const cues = source.match(/ {4}function legacyParseSubtitleCues\(source\) \{[\s\S]*?(?= {4}function legacyResolvePlaybackDuration)/)?.[0];
const wrapper = source.match(/ {4}function Ra\(e\) \{[\s\S]*?(?= {4}function Ua\(e\))/)?.[0];
const active = source.match(/ {4}function legacyFindSubtitleCue\(cues, time\) \{[\s\S]*?(?= {4}function legacyEpisodeDisplayTitle)/)?.[0];

const srt = [
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

describe("legacy subtitle integration", () => {
  it.each([true, false])("parses timestamps and cues (core available: %s)", (withCore) => {
    expect(timestamp && cues && wrapper && active).toBeTruthy();
    const runtime = runInNewContext(
      `${timestamp}\n${cues}\n${active}\n${wrapper}\n({ legacyParseSubtitleTimestamp, legacyParseSubtitleCues, legacyFindSubtitleCue, Ra })`,
      { window: { TutyCore: withCore ? core : undefined } }
    ) as {
      legacyParseSubtitleTimestamp(value: unknown): number;
      legacyParseSubtitleCues(source: unknown): Array<{ start: number; end: number; text: string }>;
      legacyFindSubtitleCue(cues: unknown, time: number): { text: string } | null;
      Ra(value: unknown): number;
    };

    expect(runtime.legacyParseSubtitleTimestamp("00:01:02,500")).toBe(62.5);
    expect(runtime.Ra("01:02:03.250")).toBe(3723.25);
    expect(runtime.legacyParseSubtitleCues(srt)).toEqual([
      { start: 1, end: 3.5, text: "Hola<br>mundo" },
      { start: 4, end: 6, text: "Segunda línea" }
    ]);
    expect(runtime.legacyParseSubtitleCues("")).toEqual([]);
    expect(runtime.legacyFindSubtitleCue([
      { start: 1, end: 3, text: "uno" },
      { start: 4, end: 6, text: "dos" }
    ], 5)).toEqual({ start: 4, end: 6, text: "dos" });
    expect(runtime.legacyFindSubtitleCue([], 5)).toBeNull();
  });
});
