import { describe, expect, it } from "vitest";
import { createLegacyActions } from "./legacyActions.js";

describe("legacy actions", () => {
  it("wires the catalog into bootstrap dependencies", () => {
    const catalog = [{ id: 1 }];
    const actions = createLegacyActions({ l: catalog } as never);
    expect(actions.getBootstrapDeps().debug.vod).toBe(catalog);
  });

  it("exposes the migrated actions and keeps pure helpers", () => {
    const actions = createLegacyActions({} as never);
    expect(actions.ja({ id: "movie" })).toBe("movie");
    expect(actions.ja({ id: "episode", seriesId: "series" })).toBe("series");
    expect(actions.ja(null)).toBe("");
    expect(typeof actions.ei).toBe("function");
    expect(typeof actions.getBootstrapDeps).toBe("function");
  });
});
