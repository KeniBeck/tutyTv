import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const appSource = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");
const helpers = appSource.match(/ {4}function legacyNavigationAction\(e\) \{[\s\S]*?(?= {4}function Q\(\))/)?.[0];
const keyHandler = appSource.match(/ {4}function lt\(e\) \{[\s\S]*?(?= {4}function dt\(\))/)?.[0];
const focusHandler = appSource.match(/ {4}function at\(e\) \{[\s\S]*?(?= {4}function nt\(e\))/)?.[0];
const visibility = appSource.match(/ {4}function legacyFocusVisible\(element\) \{[\s\S]*?(?= {4}function Ze\(\))/)?.[0];

describe("legacy adapters integration", () => {
  it("delegates key handling to the navigation runtime", () => {
    expect(keyHandler).toBeDefined();
    const handler = vi.fn(() => true);
    const runtime = runInNewContext(`${keyHandler}\n({ lt })`, {
      window: { TutyUI: { handleNavigationKey: handler } }
    }) as { lt(event: object): boolean };
    const event = { keyCode: 38 };
    expect(runtime.lt(event)).toBe(true);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it.each([true, false])("installs the original keyboard listener behavior (core available: %s)", (withCore) => {
    const listeners: Record<string, (event: object) => void> = {};
    const target = {
      addEventListener: vi.fn((type: string, listener: (event: object) => void) => { listeners[type] = listener; }),
      removeEventListener: vi.fn((type: string) => { delete listeners[type]; })
    };
    const handler = vi.fn();
    const exposedCore = { ...core, connectLegacyNavigation: vi.fn(core.connectLegacyNavigation) };
    const runtime = runInNewContext(`${helpers}\n({ legacyInstallNavigation })`, {
      window: { TutyCore: withCore ? exposedCore : undefined }
    }) as { legacyInstallNavigation(target: object, handler: (event: object) => void): void };
    runtime.legacyInstallNavigation(target, handler);
    listeners.keydown?.({ keyCode: 415 });
    listeners.keyup?.({ keyCode: 461 });
    listeners.keyup?.({ key: "GoBack" });
    listeners.keyup?.({ keyCode: 27 });
    expect(handler).toHaveBeenCalledTimes(3);
    expect(target.addEventListener).toHaveBeenCalledTimes(2);
    expect(exposedCore.connectLegacyNavigation).toHaveBeenCalledTimes(withCore ? 1 : 0);
  });

  it("delegates directional movement to the ui runtime when attached", () => {
    expect(focusHandler).toBeDefined();
    const move = vi.fn();
    const runtime = runInNewContext(`${focusHandler}\n({ at })`, {
      window: {
        TutyUI: {
          hasFocusRuntime: () => true,
          moveFocus: move
        }
      },
      j: { focus: {} }
    }) as { at(direction: string): void };

    runtime.at("down");
    expect(move).toHaveBeenCalledWith("down");
  });

  it.each([true, false])("preserves focus visibility rules (core available: %s)", (withCore) => {
    expect(visibility).toBeDefined();
    const node = (classes: string[]) => ({ classList: { contains: (name: string) => classes.includes(name) } });
    const element = (closest: Record<string, ReturnType<typeof node>>, width = 50) => ({
      offsetParent: {}, closest,
      getBoundingClientRect: () => ({ width, height: width })
    });
    const j = {
      episodeBrowserOpen: false, categoryPickerOpen: false, liveCategoriesOpen: false,
      liveSearchOpen: false, resumeOpen: false, filterOpen: false
    };
    const exposedCore = { ...core, isLegacyFocusVisible: vi.fn(core.isLegacyFocusVisible) };
    const runtime = runInNewContext(`${visibility}\n({ Ye, legacyFocusVisible })`, {
      window: { TutyCore: withCore ? exposedCore : undefined }, j, fa: false, va: false,
      n: (target: { closest: Record<string, unknown> }, selector: string) => target.closest[selector] ?? null
    }) as {
      Ye(element: object): boolean;
      legacyFocusVisible(element: object): boolean;
    };

    expect(runtime.legacyFocusVisible(element({}))).toBe(true);
    expect(runtime.legacyFocusVisible(element({ ".home-page": node([]) }))).toBe(false);
    expect(runtime.legacyFocusVisible(element({ ".home-page": node(["is-current"]) }))).toBe(true);
    expect(runtime.legacyFocusVisible(element({ ".search-hot": node(["is-hidden"]) }))).toBe(false);
    j.episodeBrowserOpen = true;
    expect(runtime.legacyFocusVisible(element({}))).toBe(false);
    expect(runtime.legacyFocusVisible(element({ "#player-episodes": node([]) }))).toBe(true);
    expect(runtime.Ye(element({ "#player-episodes": node([]) }, 0))).toBe(false);
    expect(runtime.Ye(element({ "#player-episodes": node([]) }))).toBe(true);
    expect(exposedCore.isLegacyFocusVisible).toHaveBeenCalledTimes(withCore ? 7 : 0);
  });
});
