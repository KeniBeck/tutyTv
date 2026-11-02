import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");
const restore = source.match(/ {4}function focusHomeTab\(tab\) \{[\s\S]*?(?= {4}function at\(e\))/)?.[0];

describe("legacy home focus restore", () => {
  it("restores the saved focus of the tab when it is still visible", () => {
    expect(restore).toBeDefined();
    const saved = { id: "saved", parentNode: {} };
    const first = { id: "first" };
    const tt = vi.fn();
    const runtime = runInNewContext(`${restore}\n({ focusHomeTab })`, {
      tabFocus: [saved],
      Ye: () => true,
      tt,
      H: [{ page: 1 }],
      Ne: [null, {}],
      Re: [],
      it: () => first
    }) as { focusHomeTab(tab: number): void };

    runtime.focusHomeTab(0);
    expect(tt).toHaveBeenCalledWith(saved);
  });

  it("falls back to the first visible card and then to the tab", () => {
    const first = { id: "first" };
    const tab = { id: "tab" };
    const tt = vi.fn();
    const runtime = runInNewContext(`${restore}\n({ focusHomeTab })`, {
      tabFocus: [],
      Ye: () => false,
      tt,
      H: [{ page: 2 }],
      Ne: [null, null, {}],
      Re: [tab],
      it: () => first
    }) as { focusHomeTab(tab: number): void };

    runtime.focusHomeTab(0);
    expect(tt).toHaveBeenCalledWith(first);

    tt.mockClear();
    const empty = runInNewContext(`${restore}\n({ focusHomeTab })`, {
      tabFocus: [],
      Ye: () => false,
      tt,
      H: [{ page: 2 }],
      Ne: [null, null, {}],
      Re: [tab],
      it: () => null
    }) as { focusHomeTab(tab: number): void };
    empty.focusHomeTab(0);
    expect(tt).toHaveBeenCalledWith(tab);
  });
});
