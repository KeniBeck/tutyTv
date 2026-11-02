import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");
const open = source.match(/ {4}function Oa\(e\) \{[\s\S]*?(?= {4}var Da = \[\])/)?.[0];

describe("legacy history opening", () => {
  it("forces detail loading when a history title is not already loaded", () => {
    expect(open).toBeTruthy();
    const catalogItem: Record<string, unknown> = { id: "movie", title: "Película", _detailsLoaded: false };
    const entry = { id: "movie", title: "Película", poster: "poster.jpg" };
    const ei = vi.fn();
    const runtime = runInNewContext(`${open}\n({ Oa })`, {
      l: [catalogItem], _: (item: unknown) => item, ei,
      o: (value: unknown) => String(value || "").toLowerCase()
    }) as { Oa(item: unknown): void };

    runtime.Oa(entry);
    expect(catalogItem._portal).toBe(true);
    expect(ei).toHaveBeenCalledWith(catalogItem);
  });

  it("falls back to a normalized title when an old history id no longer matches", () => {
    expect(open).toBeTruthy();
    const matched: Record<string, unknown> = { id: "new-id", title: "Película Vieja", _detailsLoaded: false };
    const ei = vi.fn();
    const runtime = runInNewContext(`${open}\n({ Oa })`, {
      l: [matched], _: (item: unknown) => item, ei,
      o: (value: unknown) => String(value || "").toLowerCase()
    }) as { Oa(item: unknown): void };

    runtime.Oa({ id: "old-id", title: "Película Vieja" });
    expect(matched._portal).toBe(true);
    expect(ei).toHaveBeenCalledWith(matched);
  });

  it("opens a normalized history item as a portal detail when it is not in the catalog", () => {
    expect(open).toBeTruthy();
    const ei = vi.fn();
    const normalized: Record<string, unknown> = { id: "external", title: "Externo" };
    const runtime = runInNewContext(`${open}\n({ Oa })`, {
      l: [], _: () => normalized, ei,
      o: (value: unknown) => String(value || "").toLowerCase()
    }) as { Oa(item: unknown): void };

    runtime.Oa({ id: "external", title: "Externo" });
    expect(normalized._portal).toBe(true);
    expect(ei).toHaveBeenCalledWith(normalized);
  });
});
