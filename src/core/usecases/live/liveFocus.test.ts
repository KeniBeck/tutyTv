import { describe, expect, it } from "vitest";
import { liveListScrollTop } from "./liveFocus";

describe("live list scroll", () => {
  it("scrolls up to reveal a row above the viewport", () => {
    expect(liveListScrollTop(2, 500, 2000, 400)).toBe(240);
  });

  it("keeps a visible row in place", () => {
    expect(liveListScrollTop(3, 240, 2000, 400)).toBe(240);
  });

  it("scrolls down enough to reveal a row below the viewport", () => {
    expect(liveListScrollTop(5, 240, 2000, 400)).toBe(300.5);
  });

  it("clamps to the end of the list", () => {
    expect(liveListScrollTop(20, 0, 800, 400)).toBe(400);
  });
});
