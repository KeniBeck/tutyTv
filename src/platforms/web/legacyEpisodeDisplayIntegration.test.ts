import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");
const title = source.match(/ {4}function legacyEpisodeDisplayTitle\(series, episode, index\) \{[\s\S]*?(?= {4}function legacyFormatEpisodeDuration)/)?.[0];
const duration = source.match(/ {4}function legacyFormatEpisodeDuration\(value\) \{[\s\S]*?(?= {4}function legacyResolvePlaybackDuration)/)?.[0];
const dn = source.match(/ {4}function dn\(e, t, i\) \{[\s\S]*?(?= {4}function cn\(e\))/)?.[0];
const cn = source.match(/ {4}function cn\(e\) \{[\s\S]*?(?= {4}function pn\(\))/)?.[0];

describe("legacy episode display integration", () => {
  it.each([true, false])("formats episode titles and durations (core available: %s)", (withCore) => {
    expect(title && duration && dn && cn).toBeTruthy();
    const runtime = runInNewContext(
      `${title}\n${duration}\n${dn}\n${cn}\n({ legacyEpisodeDisplayTitle, legacyFormatEpisodeDuration, dn, cn })`,
      { window: { TutyCore: withCore ? core : undefined } }
    ) as {
      legacyEpisodeDisplayTitle(series: unknown, episode: unknown, index: number): string;
      legacyFormatEpisodeDuration(value: unknown): string;
      dn(series: unknown, episode: unknown, index: number): string;
      cn(episode: unknown): string;
    };

    expect(runtime.legacyEpisodeDisplayTitle(
      { title: "Serie T1" },
      { title: "Serie: El inicio", number: 3 },
      0
    )).toBe("El inicio");
    expect(runtime.dn({ title: "Serie" }, { title: "Serie: El inicio" }, 0)).toBe("El inicio");
    expect(runtime.dn({ title: "Serie" }, { title: "1 - 2" }, 4)).toBe("Episodio 5");
    expect(runtime.legacyFormatEpisodeDuration("01:02:03")).toBe("1 h 2 min");
    expect(runtime.cn({ duration: "45:00" })).toBe("45 min");
    expect(runtime.cn({ duration: "" })).toBe("");
  });
});
