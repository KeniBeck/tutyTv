import { describe, expect, it } from "vitest";
import { computeLegacyScrollAdjustment } from "./focusScroll";

const container = { left: 100, right: 400, top: 50, bottom: 250 };

describe("legacy focus scroll", () => {
  it("keeps an element inside the viewport without movement", () => {
    expect(computeLegacyScrollAdjustment(
      { left: 120, right: 200, top: 80, bottom: 120 },
      container,
      { offsetWidth: 300, offsetHeight: 200, scrollWidth: 300, clientWidth: 300 }
    )).toEqual({ top: 0, left: 0 });
  });

  it("adds the legacy 12px margin when the element overflows", () => {
    expect(computeLegacyScrollAdjustment(
      { left: 80, right: 150, top: 20, bottom: 80 },
      container,
      { offsetWidth: 300, offsetHeight: 200, scrollWidth: 600, clientWidth: 300 }
    )).toEqual({ top: -42, left: -32 });
    expect(computeLegacyScrollAdjustment(
      { left: 380, right: 460, top: 240, bottom: 300 },
      container,
      { offsetWidth: 300, offsetHeight: 200, scrollWidth: 600, clientWidth: 300 }
    )).toEqual({ top: 62, left: 72 });
  });

  it("ignores horizontal movement when there is no horizontal scroll", () => {
    expect(computeLegacyScrollAdjustment(
      { left: 80, right: 150, top: 80, bottom: 120 },
      container,
      { offsetWidth: 300, offsetHeight: 200, scrollWidth: 300, clientWidth: 300 }
    )).toEqual({ top: 0, left: 0 });
  });

  it("falls back to a 1:1 scale for invalid metrics", () => {
    expect(computeLegacyScrollAdjustment(
      { left: 80, right: 150, top: 20, bottom: 80 },
      container,
      { offsetWidth: 0, offsetHeight: -1, scrollWidth: 600, clientWidth: 300 }
    )).toEqual({ top: -42, left: -32 });
  });
});
