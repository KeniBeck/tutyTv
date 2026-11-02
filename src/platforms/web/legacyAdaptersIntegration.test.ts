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
  it.each([true, false])("preserves keyboard, remote and pause behavior (core available: %s)", (withCore) => {
    expect(helpers).toBeDefined();
    expect(keyHandler).toBeDefined();
    const move = vi.fn();
    const activate = vi.fn();
    const back = vi.fn();
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    const video = { pause: vi.fn(), play: vi.fn(), paused: false };
    const j = { screen: "home", tab: 1, playerMode: "vod" };
    const pauseSpy = vi.spyOn(core.player, "pause");
    const playSpy = vi.spyOn(core.player, "play");
    const seek = vi.fn();
    const openSettings = vi.fn();
    const runtime = runInNewContext(`${helpers}\n${keyHandler}\n({ lt, legacyNativeTvPlayback, legacyMediaKey })`, {
      window: { TutyCore: withCore ? core : undefined },
      navigator: { userAgent: "SmartTV" },
      j, Pt: false, fa: false, va: false, we: video,
      at: move, st: activate, ot: back, qi: vi.fn(), Pi: vi.fn(), Oi: seek, tn: openSettings
    }) as {
      lt(event: object): void;
      legacyNativeTvPlayback(): boolean;
      legacyMediaKey(code: number, key: string): string | null;
    };

    runtime.lt({ which: 38, preventDefault });
    runtime.lt({ keyCode: 32, preventDefault });
    runtime.lt({ keyCode: 37, key: "Back", preventDefault, stopPropagation });
    runtime.lt({ key: "ArrowRight", preventDefault });
    expect(move).toHaveBeenCalledOnce();
    expect(move).toHaveBeenCalledWith("up");
    expect(activate).toHaveBeenCalledOnce();
    expect(back).toHaveBeenCalledOnce();
    expect(preventDefault).toHaveBeenCalledTimes(3);
    expect(stopPropagation).toHaveBeenCalledOnce();
    expect(runtime.legacyNativeTvPlayback()).toBe(true);

    j.screen = "player";
    runtime.lt({ keyCode: 19, preventDefault });
    expect(video.pause).toHaveBeenCalledOnce();
    expect(pauseSpy).toHaveBeenCalledTimes(withCore ? 1 : 0);
    expect(runtime.legacyMediaKey(415, "")).toBe("play");
    video.paused = true;
    runtime.lt({ keyCode: 415, preventDefault });
    expect(video.play).toHaveBeenCalledOnce();
    expect(playSpy).toHaveBeenCalledTimes(withCore ? 1 : 0);
    runtime.lt({ keyCode: 417, preventDefault });
    expect(seek).toHaveBeenLastCalledWith(15);
    runtime.lt({ keyCode: 412, preventDefault });
    expect(seek).toHaveBeenLastCalledWith(-15);
    runtime.lt({ keyCode: 413, preventDefault });
    expect(back).toHaveBeenCalledTimes(2);
    runtime.lt({ keyCode: 457, preventDefault });
    expect(openSettings).toHaveBeenCalledOnce();
    pauseSpy.mockRestore();
    playSpy.mockRestore();
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

  it.each([true, false])("preserves directional focus scoring and home-tab fallback (core available: %s)", (withCore) => {
    expect(focusHandler).toBeDefined();
    const node = (left: number, top: number, inPage = false, inTabs = false) => ({
      inPage, inTabs, _onMove: undefined as ((direction: string) => boolean) | undefined,
      getBoundingClientRect: () => ({ left, right: left + 50, top, bottom: top + 50, width: 50, height: 50 })
    });
    const current = node(100, 100, true);
    const aligned = node(200, 100);
    const diagonal = node(160, 180);
    const tabs = node(0, 100, false, true);
    const j = { focus: current, screen: "home", tab: 0 };
    const move = vi.fn((target: typeof current) => { j.focus = target; });
    const exposedCore = { ...core, scoreLegacyFocus: vi.fn(core.scoreLegacyFocus) };
    const runtime = runInNewContext(`${focusHandler}\n({ at })`, {
      window: { TutyCore: withCore ? exposedCore : undefined }, j, Re: [tabs],
      Ze: () => [current, aligned, diagonal, tabs], tt: move,
      n: (target: typeof current, selector: string) => selector === ".home-page" ? target.inPage : target.inTabs
    }) as { at(direction: string): void };
    runtime.at("right");
    expect(move).toHaveBeenLastCalledWith(aligned);
    expect(exposedCore.scoreLegacyFocus).toHaveBeenCalledTimes(withCore ? 2 : 0);
    j.focus = current;
    runtime.at("left");
    expect(move).toHaveBeenLastCalledWith(tabs);
    j.focus = current;
    current._onMove = () => true;
    runtime.at("right");
    expect(move).toHaveBeenCalledTimes(2);
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
