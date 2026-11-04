import type { NavigationAdapter } from "../../core/contracts/navigation-adapter";

export type NavigationDirection = "up" | "down" | "left" | "right";
export type NavigationAction = "back" | "enter" | NavigationDirection;

export interface KeyboardEventLike {
  keyCode?: number;
  which?: number;
  key?: string;
  preventDefault?: () => void;
}

export function mapLegacyKeyToAction(event: KeyboardEventLike): NavigationAction | null {
  const keyCode = event.keyCode || event.which;
  const key = event.key || "";
  if (key === "Back" || key === "GoBack" || key === "Escape") {
    return "back";
  }
  if (keyCode === 32) {
    return "enter";
  }
  return typeof keyCode === "number" ? mapKeyToAction({ keyCode }) : null;
}

export interface NavigationTarget {
  addEventListener(type: "keydown", listener: (event: KeyboardEventLike) => void): void;
  removeEventListener(type: "keydown", listener: (event: KeyboardEventLike) => void): void;
}

export interface NavigationAdapterHandle extends NavigationAdapter {
  dispose(): void;
}

export interface FocusRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

export function scoreLegacyFocus(direction: string, current: FocusRect, candidate: FocusRect): number | null {
  const dx = candidate.left + candidate.width / 2 - (current.left + current.width / 2);
  const dy = candidate.top + candidate.height / 2 - (current.top + current.height / 2);
  let distance: number;
  let cross: number;
  let overlaps: boolean;
  if (direction === "left") {
    if (dx > -4) return null;
    distance = Math.max(0, current.left - candidate.right);
    cross = Math.abs(dy);
    overlaps = candidate.bottom > current.top + 2 && candidate.top < current.bottom - 2;
  } else if (direction === "right") {
    if (dx < 4) return null;
    distance = Math.max(0, candidate.left - current.right);
    cross = Math.abs(dy);
    overlaps = candidate.bottom > current.top + 2 && candidate.top < current.bottom - 2;
  } else if (direction === "up") {
    if (dy > -4) return null;
    distance = Math.max(0, current.top - candidate.bottom);
    cross = Math.abs(dx);
    overlaps = candidate.right > current.left + 2 && candidate.left < current.right - 2;
  } else {
    if (dy < 4) return null;
    distance = Math.max(0, candidate.top - current.bottom);
    cross = Math.abs(dx);
    overlaps = candidate.right > current.left + 2 && candidate.left < current.right - 2;
  }
  return distance + 0.5 * cross + (overlaps ? 0 : 320);
}

export interface LegacyNavigationTarget {
  addEventListener(type: "keydown" | "keyup", listener: (event: KeyboardEventLike) => void, capture: false): void;
  removeEventListener(type: "keydown" | "keyup", listener: (event: KeyboardEventLike) => void, capture: false): void;
}

export function connectLegacyNavigation(target: LegacyNavigationTarget, handler: (event: KeyboardEventLike) => void): { dispose(): void } {
  const onKeyUp = (event: KeyboardEventLike): void => {
    if ((event.keyCode || event.which) === 461 || event.key === "Back" || event.key === "GoBack") {
      handler(event);
    }
  };
  target.addEventListener("keydown", handler, false);
  target.addEventListener("keyup", onKeyUp, false);
  return {
    dispose(): void {
      target.removeEventListener("keydown", handler, false);
      target.removeEventListener("keyup", onKeyUp, false);
    }
  };
}

const DIRECTION_BY_KEY: Record<string, NavigationDirection> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right"
};

const DIRECTION_BY_KEY_CODE: Record<number, NavigationDirection> = {
  37: "left",
  38: "up",
  39: "right",
  40: "down"
};

export function mapKeyToAction(event: KeyboardEventLike): NavigationAction | null {
  const key = event.key ?? "";

  if (key === "GoBack" || key === "Backspace" || key === "Escape") {
    return "back";
  }

  if (key === "Enter") {
    return "enter";
  }

  const directionByKey = DIRECTION_BY_KEY[key];
  if (directionByKey) {
    return directionByKey;
  }

  const keyCode = event.keyCode;
  if (keyCode === 461 || keyCode === 8 || keyCode === 27) {
    return "back";
  }

  if (keyCode === 13) {
    return "enter";
  }

  if (keyCode !== undefined) {
    return DIRECTION_BY_KEY_CODE[keyCode] ?? null;
  }

  return null;
}

export function createNavigationAdapter(
  target: NavigationTarget,
  options: { preventDefault?: boolean } = {}
): NavigationAdapterHandle {
  const backHandlers = new Set<() => void>();
  const directionHandlers = new Set<(direction: NavigationDirection) => void>();
  const enterHandlers = new Set<() => void>();

  const listener = (event: KeyboardEventLike): void => {
    const action = mapKeyToAction(event);
    if (!action) {
      return;
    }

    if (options.preventDefault) {
      event.preventDefault?.();
    }

    if (action === "back") {
      for (const handler of backHandlers) {
        handler();
      }
      return;
    }

    if (action === "enter") {
      for (const handler of enterHandlers) {
        handler();
      }
      return;
    }

    for (const handler of directionHandlers) {
      handler(action);
    }
  };

  target.addEventListener("keydown", listener);

  return {
    onBack(handler: () => void): void {
      backHandlers.add(handler);
    },
    onDirectional(handler: (direction: NavigationDirection) => void): void {
      directionHandlers.add(handler);
    },
    onEnter(handler: () => void): void {
      enterHandlers.add(handler);
    },
    dispose(): void {
      target.removeEventListener("keydown", listener);
      backHandlers.clear();
      directionHandlers.clear();
      enterHandlers.clear();
    }
  };
}
