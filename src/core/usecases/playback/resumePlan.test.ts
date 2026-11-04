import { describe, expect, it } from "vitest";
import { resolveHistoryEpisode, resolveResumePlan } from "./resumePlan";

describe("resume plan", () => {
  it("uses history position and duration and prompts above two seconds", () => {
    expect(resolveResumePlan({ position: 60, duration: 100 }, null, 1, true, false)).toEqual({
      position: 60, duration: 100, isSeries: true, episodeCount: 1,
      mismatchReset: false, shouldPrompt: true
    });
    expect(resolveResumePlan({ position: 2, duration: 100 }, null, 1, false, false)).toMatchObject({
      position: 2, shouldPrompt: false
    });
    expect(resolveResumePlan(null, null, 1, true, false)).toMatchObject({
      position: 0, duration: 0, isSeries: false, shouldPrompt: false
    });
  });

  it("resets when history belongs to another existing episode", () => {
    const plan = resolveResumePlan(
      { position: 80, duration: 100, episodeId: "ep-2" },
      { id: "ep-1" },
      4,
      true,
      true
    );
    expect(plan).toMatchObject({ position: 0, mismatchReset: true, shouldPrompt: false, isSeries: true });
  });

  it("does not reset for a single episode or a missing history episode", () => {
    expect(resolveResumePlan(
      { position: 80, duration: 100, episodeId: "ep-2" },
      { id: "ep-1" },
      1,
      true,
      true
    ).mismatchReset).toBe(false);
    expect(resolveResumePlan(
      { position: 80, duration: 100, episodeId: "ep-2" },
      { id: "ep-1" },
      4,
      true,
      false
    ).mismatchReset).toBe(false);
  });

  it("rebuilds the episode from history or finds it in the season", () => {
    const episodes = [{ id: "ep-1", title: "Uno" }, { id: "ep-2", title: "Dos" }];
    expect(resolveHistoryEpisode({ episodeId: "ep-1" }, episodes)).toBe(episodes[0]);
    expect(resolveHistoryEpisode({
      episodeId: "ep-9",
      episodeNumber: 9,
      episodeTitle: "Nueve",
      duration: 45
    }, episodes)).toEqual({ id: "ep-9", number: 9, title: "Nueve", duration: 45 });
    expect(resolveHistoryEpisode(null, episodes)).toBeNull();
  });
});
