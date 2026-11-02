import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");

const snippets = {
  helpers: [
    source.match(/ {4}function o\(e\) \{[\s\S]*?\n {4}\}/)?.[0],
    source.match(/ {4}function x\(e, t\) \{[\s\S]*?\n {4}\}/)?.[0],
    source.match(/ {4}function w\(e\) \{[\s\S]*?\n {4}\}/)?.[0]
  ].join("\n"),
  main: [
    source.match(/ {4}function g\(e\) \{[\s\S]*?\n {4}\}/)?.[0],
    source.match(/ {4}function S\(e\) \{[\s\S]*?\n {4}\}/)?.[0],
    source.match(/ {4}function _\(e, t\) \{[\s\S]*?\n {4}\}/)?.[0],
    source.match(/ {4}function k\(e\) \{[\s\S]*?\n {4}\}/)?.[0]
  ].join("\n"),
  wrappers: source.match(
    / {4}function legacyIsSeriesLike\(item\) \{[\s\S]*?(?= {4}function legacyResolvePlaybackDuration)/
  )?.[0]
};

describe("legacy catalog normalization integration", () => {
  it.each([true, false])("extracts and normalizes portal payloads (core available: %s)", (withCore) => {
    expect(snippets.helpers && snippets.main && snippets.wrappers).toBeTruthy();
    const runtime = runInNewContext(
      `${snippets.helpers}\n${snippets.wrappers}\n${snippets.main}\n`
      + "({ g, S, _, k, legacyIsSeriesLike, legacyParseSeriesSeasonTitle, "
      + "legacyExtractCatalogItems, legacyNormalizeCatalogItem })",
      {
        window: { TutyCore: withCore ? core : undefined },
        p: { imageBaseUrl: "https://img.example/", mode: "portal" }
      }
    ) as {
      g(payload: unknown): unknown[];
      S(item: unknown): boolean;
      _(item: unknown, index: number): Record<string, unknown>;
      k(item: unknown): { title: string; number: number } | null;
      legacyIsSeriesLike(item: unknown): boolean;
      legacyParseSeriesSeasonTitle(item: unknown): { title: string; number: number } | null;
      legacyExtractCatalogItems(payload: unknown): unknown[];
      legacyNormalizeCatalogItem(item: unknown, index: number): Record<string, unknown>;
    };

    const items = [{ id: "program-1234567890", title: "Serie S01", type: "series" }];
    expect(runtime.g({ data: { items } })).toEqual(items);
    expect(runtime.legacyExtractCatalogItems({ results: items })).toEqual(items);
    expect(runtime.S(items[0])).toBe(true);
    expect(runtime.k({ type: "series", title: "Serie Temporada 2" }))
      .toEqual({ title: "Serie", number: 2 });

    const normalized = runtime._({
      id: "program-1234567890",
      title: "Serie S01",
      category: "Acción",
      type: "series",
      genres: "Drama, Acción",
      duration: 90,
      posterUrl: "/poster.jpg",
      episodes: [{}]
    }, 1);
    expect(normalized).toMatchObject({
      id: "program-1234567890",
      title: "Serie S01",
      category: "accion",
      type: "series",
      kind: "serie",
      genres: ["Drama", " Acción"],
      duration: "1 h 30 min",
      poster: "https://img.example/poster.jpg",
      _portal: true
    });
    expect(runtime._({}, 2)).toMatchObject({
      id: "api-2",
      title: "Sin título",
      kind: "película"
    });
  });
});
