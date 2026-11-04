import { describe, expect, it } from "vitest";
import { showScreen } from "./router";
import { createAppState } from "./state";

function screen() {
  const classes = new Set<string>(["is-active"]);
  return {
    classes,
    classList: {
      add: (name: string) => classes.add(name),
      remove: (name: string) => classes.delete(name)
    }
  };
}

describe("showScreen", () => {
  it("toggles the active screen and updates state", () => {
    const home = screen();
    const player = screen();
    const state = createAppState();
    const documentRoot = {
      querySelectorAll: () => [home, player],
      getElementById: (id: string) => id === "screen-player" ? player : null
    } as unknown as Document;

    const target = showScreen("player", documentRoot, state);

    expect(target).toBe(player);
    expect(state.screen).toBe("player");
    expect(home.classes.has("is-active")).toBe(false);
    expect(player.classes.has("is-active")).toBe(true);
  });

  it("keeps state when the screen does not exist", () => {
    const state = createAppState();
    const documentRoot = {
      querySelectorAll: () => [],
      getElementById: () => null
    } as unknown as Document;

    expect(showScreen("missing", documentRoot, state)).toBeNull();
    expect(state.screen).toBe("missing");
  });
});
