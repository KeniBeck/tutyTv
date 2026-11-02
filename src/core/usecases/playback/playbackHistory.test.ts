import { describe, expect, it } from "vitest";
import { updatePlaybackHistory } from "./playbackHistory";

describe("updatePlaybackHistory", () => {
  it("builds the existing profile format, deduplicates and limits history", () => {
    const history = [{ id: "7" }, ...Array.from({ length: 35 }, (_, i) => ({ id: `old-${i}` }))];
    const result = updatePlaybackHistory(
      history, { id: 7, name: "Serie", cover: "cover", duration: 80 },
      { id: 3, seriesNumber: 2 }, 12.9, 0, 1234, true
    );
    expect(result[0]).toEqual({
      id: "7", title: "Serie", poster: "cover", series: true,
      seriesId: "7", seasonId: "7", episodeId: "3", episodeNumber: 2,
      episodeTitle: "", position: 12, duration: 80, updatedAt: 1234
    });
    expect(result).toHaveLength(30);
    expect(result.filter((entry) => entry.id === "7")).toHaveLength(1);
    expect(history).toHaveLength(36);
  });

  it("persists series and season ids and deduplicates by series", () => {
    const history = [{ id: "season1", seriesId: "series", position: 10 }];
    const result = updatePlaybackHistory(
      history,
      { id: "season2", title: "Serie T2", seriesId: "season2" },
      { id: "ep", title: "Episodio", number: 2 },
      30, 50, 9, true,
      { seriesId: "series", seasonId: "season2" }
    );
    expect(result[0]).toMatchObject({
      id: "season2", seriesId: "series", seasonId: "season2",
      episodeTitle: "Episodio", series: true
    });
    expect(result).toHaveLength(1);
  });

  it("preserves movie defaults and fallback values", () => {
    const result = updatePlaybackHistory([], { id: "m" }, null, 3.5, 61.9, 5, false);
    expect(result[0]).toEqual({
      id: "m", title: "Contenido", poster: "", series: false,
      seriesId: "m", seasonId: "m", episodeId: "", episodeNumber: "",
      episodeTitle: "", position: 3, duration: 61, updatedAt: 5
    });
  });
});
