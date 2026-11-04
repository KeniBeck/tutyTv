import { describe, expect, it } from "vitest";
import { limitSeekPosition } from "./seekPosition";

describe("limitSeekPosition", () => {
  it("clamps local playback to zero and one second before the end", () => {
    expect(limitSeekPosition(-10, 100, false)).toBe(0);
    expect(limitSeekPosition(120, 100, false)).toBe(99);
    expect(limitSeekPosition(42.5, 100, false)).toBe(42.5);
    expect(limitSeekPosition(120, 0, false)).toBe(120);
    expect(limitSeekPosition(2, 0.5, false)).toBe(-0.5);
  });

  it("preserves the relay's two-second margin and short-duration behavior", () => {
    expect(limitSeekPosition(120, 100, true)).toBe(98);
    expect(limitSeekPosition(3.5, 100, true)).toBe(3.5);
    expect(limitSeekPosition(120, 0, true)).toBe(120);
    expect(limitSeekPosition(1, 1, true)).toBe(0);
  });
});
