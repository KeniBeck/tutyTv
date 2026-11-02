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
  source.match(
    / {4}function legacyFindLocalSearchMatches\(items, query\) \{[\s\S]*?(?= {4}function legacyResolvePlaybackDuration)/
  )?.[0]
].join("\n");

describe("legacy catalog search integration", () => {
  it("keeps the search UI connected to the Core helpers", () => {
    expect(source).toMatch(/var i = legacyFindLocalSearchMatches\(l, e\);/);
    expect(source).toMatch(/fi\(legacyCombineSearchResults\(i, t\.items, function\(item, index\)/);
  });

  it.each([true, false])("searches locally and merges remote results (core available: %s)", (withCore) => {
    expect(snippet).toBeTruthy();
    const runtime = runInNewContext(
      `${snippet}\n({ legacyFindLocalSearchMatches, legacyCombineSearchResults })`,
      { window: { TutyCore: withCore ? core : undefined } }
    ) as {
      legacyFindLocalSearchMatches(
        items: Array<{ id: string; title: string; alias?: string }>,
        query: string
      ): Array<{ id: string; title: string; alias?: string }>;
      legacyCombineSearchResults(
        local: Array<{ id: string; title: string }>,
        remote: Array<{ id: string; title: string }>,
        normalize: (item: unknown, index: number) => { id: string; title: string }
      ): Array<{ id: string; title: string }>;
    };

    const items = [
      { id: "1", title: "Acción Total" },
      { id: "2", title: "Otra", alias: "Serie Épica" },
      { id: "3", title: "Drama" }
    ];
    expect(runtime.legacyFindLocalSearchMatches(items, "accion")).toEqual([items[0]]);
    expect(runtime.legacyFindLocalSearchMatches(items, "epica")).toEqual([items[1]]);
    expect(runtime.legacyFindLocalSearchMatches(items, "  ")).toEqual([]);

    const indexes: number[] = [];
    const merged = runtime.legacyCombineSearchResults(
      [items[0]!],
      [
        { id: "2", title: "Remoto 2" },
        { id: "1", title: "Duplicado" },
        { id: "3", title: "Remoto 3" }
      ],
      (item, index) => {
        indexes.push(index);
        return item as { id: string; title: string };
      }
    );
    expect(merged.map((item) => item.id)).toEqual(["1", "2", "3"]);
    expect(indexes).toEqual([2, 3, 3]);
  });
});
