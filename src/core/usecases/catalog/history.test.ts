import { describe, expect, it } from "vitest";
import { episodeIdExists, findHistoryEntry } from "./history";

describe("history", () => {
  const history = [
    { id: "a1", position: 10 },
    { id: "b2", position: 20 }
  ];

  it("finds an entry by string or numeric id", () => {
    expect(findHistoryEntry(history, { id: "b2" })).toEqual({ id: "b2", position: 20 });
    expect(findHistoryEntry(history, { id: "missing" })).toBeNull();
    expect(findHistoryEntry(history, null)).toBeNull();
  });

  it("matches a series entry by its stable series id", () => {
    const entries = [{ id: "season2", seriesId: "series", position: 30 }];
    expect(findHistoryEntry(entries, { id: "series" })).toEqual(entries[0]);
    expect(findHistoryEntry(entries, { id: "other", _seriesId: "series" })).toEqual(entries[0]);
  });

  it("checks whether an episode id exists", () => {
    const item = { episodes: [{ id: "e1" }, { id: "e2" }] };
    expect(episodeIdExists(item, "e2")).toBe(true);
    expect(episodeIdExists(item, "e3")).toBe(false);
    expect(episodeIdExists(null, "e1")).toBe(false);
  });
});
