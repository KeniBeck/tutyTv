import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");

const snippet = [
  source.match(/ {4}function o\(e\) \{[\s\S]*?\n {4}\}/)?.[0],
  source.match(/ {4}function k\(e\) \{[\s\S]*?\n {4}\}/)?.[0],
  source.match(/ {4}function legacyIsSeriesLike\(item\) \{[\s\S]*?\n {4}\}/)?.[0],
  source.match(/ {4}function legacyParseSeriesSeasonTitle\(item\) \{[\s\S]*?\n {4}\}/)?.[0],
  source.match(
    / {4}function legacyGroupCatalogSeries\(items\) \{[\s\S]*?(?= {4}function legacyResolvePlaybackDuration)/
  )?.[0]
].join("\n");

describe("legacy catalog grouping integration", () => {
  it("keeps M and O connected to the grouping Core helpers", () => {
    expect(source).toMatch(/for \(var f = legacyGroupCatalogSeries\(d\), h = 0;/);
    expect(source).toMatch(/var merged = legacyMergePortalRoots\(e, h, T\(\)\);/);
  });

  it.each([true, false])("groups seasons and merges portal roots (core available: %s)", (withCore) => {
    expect(snippet).toBeTruthy();
    const runtime = runInNewContext(
      `${snippet}\n({ legacyGroupCatalogSeries, legacyMergePortalRoots })`,
      { window: { TutyCore: withCore ? core : undefined } }
    ) as {
      legacyGroupCatalogSeries(items: Array<Record<string, unknown>>): Array<Record<string, unknown>>;
      legacyMergePortalRoots(
        roots: Record<string, unknown>,
        rootKeys: string[],
        bundled: Array<Record<string, unknown>>
      ): Array<Record<string, unknown>>;
    };

    const grouped = runtime.legacyGroupCatalogSeries([
      { id: "s2", title: "Serie Temporada 2", type: "series", category: "Drama" },
      { id: "s1", title: "Serie Temporada 1", type: "series", category: "Acción,Drama" }
    ]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0]).toMatchObject({
      id: "s1",
      title: "Serie",
      _seriesGroup: true,
      _seriesTitle: "Serie",
      category: "Acción,Drama"
    });
    expect(grouped[0]?.seasons).toEqual([
      { id: "s1", number: 1, title: "Serie" },
      { id: "s2", number: 2, title: "Serie" }
    ]);

    const merged = runtime.legacyMergePortalRoots(
      {
        movies: [{ id: "1", title: "Uno", category: "Drama", poster: "" }],
        series: [
          { id: "1", title: "", category: "Acción", poster: "p.jpg" },
          { id: "2", title: "Dos", category: "Comedia" }
        ]
      },
      ["movies", "series"],
      [{ id: "local", title: "Local", streamUrl: "video.mp4", category: "otro" }]
    );
    expect(merged).toHaveLength(3);
    expect(merged[0]).toMatchObject({
      id: "1",
      title: "Uno",
      category: "Drama,Acción",
      poster: "p.jpg",
      portal: true
    });
    expect(merged[2]).toMatchObject({
      id: "local",
      category: "demo",
      portal: false
    });
  });
});
