import { describe, expect, it, vi } from "vitest";
import {
  createNavigationAdapter,
  connectLegacyNavigation,
  mapLegacyKeyToAction,
  mapKeyToAction,
  scoreLegacyFocus,
  type KeyboardEventLike,
  type NavigationTarget
} from "./navigationAdapter";

function createTarget(): NavigationTarget & { dispatch: (event: KeyboardEventLike) => void } {
  let listener: ((event: KeyboardEventLike) => void) | null = null;

  return {
    addEventListener(type, next) {
      if (type === "keydown") {
        listener = next;
      }
    },
    removeEventListener() {
      listener = null;
    },
    dispatch(event) {
      listener?.(event);
    }
  };
}

describe("mapKeyToAction", () => {
  it("maps webOS remote codes", () => {
    expect(mapKeyToAction({ keyCode: 461 })).toBe("back");
    expect(mapKeyToAction({ keyCode: 38 })).toBe("up");
    expect(mapKeyToAction({ keyCode: 40 })).toBe("down");
    expect(mapKeyToAction({ keyCode: 37 })).toBe("left");
    expect(mapKeyToAction({ keyCode: 39 })).toBe("right");
    expect(mapKeyToAction({ keyCode: 13 })).toBe("enter");
  });

  it("maps modern key names", () => {
    expect(mapKeyToAction({ key: "GoBack" })).toBe("back");
    expect(mapKeyToAction({ key: "ArrowUp" })).toBe("up");
    expect(mapKeyToAction({ key: "Enter" })).toBe("enter");
    expect(mapKeyToAction({ key: "x" })).toBeNull();
  });
});

describe("mapLegacyKeyToAction", () => {
  it("preserves remote keys, space, which and legacy precedence", () => {
    expect(mapLegacyKeyToAction({ which: 38 })).toBe("up");
    expect(mapLegacyKeyToAction({ keyCode: 32 })).toBe("enter");
    expect(mapLegacyKeyToAction({ keyCode: 37, key: "Back" })).toBe("back");
    expect(mapLegacyKeyToAction({ key: "GoBack" })).toBe("back");
    expect(mapLegacyKeyToAction({ key: "ArrowLeft" })).toBeNull();
    expect(mapLegacyKeyToAction({ key: "Backspace" })).toBeNull();
  });
});

describe("scoreLegacyFocus", () => {
  it("prefers the nearest row over a distant aligned card", () => {
    const current = { left: 171, right: 1043, top: 165, bottom: 725, width: 872, height: 560 };
    const small = { left: 192, right: 605, top: 718, bottom: 940, width: 413, height: 222 };
    const poster = { left: 1020, right: 1270, top: 910, bottom: 1270, width: 250, height: 360 };
    const smallScore = scoreLegacyFocus("down", current, small);
    const posterScore = scoreLegacyFocus("down", current, poster);
    expect(smallScore).not.toBeNull();
    expect(posterScore).not.toBeNull();
    expect(smallScore!).toBeLessThan(posterScore!);
  });
});

describe("createNavigationAdapter", () => {
  it("dispatches handlers and can be disposed", () => {
    const target = createTarget();
    const adapter = createNavigationAdapter(target);
    const onBack = vi.fn();
    const onEnter = vi.fn();
    const onDirectional = vi.fn();

    adapter.onBack(onBack);
    adapter.onEnter(onEnter);
    adapter.onDirectional(onDirectional);

    target.dispatch({ keyCode: 461 });
    target.dispatch({ keyCode: 13 });
    target.dispatch({ keyCode: 40 });
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onDirectional).toHaveBeenCalledWith("down");

    adapter.dispose();
    target.dispatch({ keyCode: 461 });
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe("connectLegacyNavigation", () => {
  it("forwards every keydown and only remote-back keyup, then disposes", () => {
    const listeners: Record<string, (event: KeyboardEventLike) => void> = {};
    const target = {
      addEventListener: vi.fn((type: string, listener: (event: KeyboardEventLike) => void) => { listeners[type] = listener; }),
      removeEventListener: vi.fn((type: string) => { delete listeners[type]; })
    };
    const handler = vi.fn();
    const connection = connectLegacyNavigation(target, handler);
    listeners.keydown?.({ keyCode: 415 });
    listeners.keyup?.({ which: 461 });
    listeners.keyup?.({ key: "Back" });
    listeners.keyup?.({ key: "GoBack" });
    listeners.keyup?.({ keyCode: 27 });
    expect(handler).toHaveBeenCalledTimes(4);
    expect(target.addEventListener).toHaveBeenNthCalledWith(1, "keydown", handler, false);
    connection.dispose();
    expect(target.removeEventListener).toHaveBeenCalledTimes(2);
    expect(listeners.keydown).toBeUndefined();
    expect(listeners.keyup).toBeUndefined();
  });
});
