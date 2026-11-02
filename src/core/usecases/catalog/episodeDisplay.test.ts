import { describe, expect, it } from "vitest";
import { episodeDisplayTitle, formatEpisodeDuration } from "./episodeDisplay";

describe("episode display", () => {
  it("removes the series prefix and falls back to the episode number", () => {
    expect(episodeDisplayTitle(
      { title: "Serie T1" },
      { title: "Serie: El inicio", number: 3 },
      0
    )).toBe("El inicio");
    expect(episodeDisplayTitle(
      { title: "Serie" },
      { title: "Serie: El inicio" },
      0
    )).toBe("El inicio");
    expect(episodeDisplayTitle(
      { title: "Serie" },
      { title: "1 - 2" },
      4
    )).toBe("Episodio 5");
    expect(episodeDisplayTitle({ title: "Serie" }, { name: "" }, 0)).toBe("Episodio 1");
  });

  it("formats episode durations for metadata labels", () => {
    expect(formatEpisodeDuration("01:02:03")).toBe("1 h 2 min");
    expect(formatEpisodeDuration("45:00")).toBe("45 min");
    expect(formatEpisodeDuration("45 min")).toBe("45 min");
    expect(formatEpisodeDuration("")).toBe("");
    expect(formatEpisodeDuration(undefined)).toBe("");
  });
});
