import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");
const adjust = source.match(/ {4}function legacyFocusScrollAdjustment\(rect, container, metrics\) \{[\s\S]*?(?= {4}function legacyFocusVisible)/)?.[0];

const container = { left: 100, right: 400, top: 50, bottom: 250 };

describe("legacy focus scroll integration", () => {
  it.each([true, false])("computes the same scroll adjustment (core available: %s)", (withCore) => {
    expect(adjust).toBeDefined();
    const runtime = runInNewContext(
      `${adjust}\n({ legacyFocusScrollAdjustment })`,
      { window: { TutyCore: withCore ? core : undefined } }
    ) as {
      legacyFocusScrollAdjustment(
        rect: { left: number; right: number; top: number; bottom: number },
        container: { left: number; right: number; top: number; bottom: number },
        metrics: { offsetWidth: number; offsetHeight: number; scrollWidth: number; clientWidth: number }
      ): { top: number; left: number };
    };

    expect(runtime.legacyFocusScrollAdjustment(
      { left: 80, right: 150, top: 20, bottom: 80 },
      container,
      { offsetWidth: 300, offsetHeight: 200, scrollWidth: 600, clientWidth: 300 }
    )).toEqual({ top: -42, left: -32 });
    expect(runtime.legacyFocusScrollAdjustment(
      { left: 120, right: 200, top: 80, bottom: 120 },
      container,
      { offsetWidth: 300, offsetHeight: 200, scrollWidth: 300, clientWidth: 300 }
    )).toEqual({ top: 0, left: 0 });
  });
});
