import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppState } from "../../runtime/state";
import {
  attachNextEpisodePrompt,
  canOfferNextEpisode,
  cancelNextEpisodePrompt,
  closeNextEpisodePrompt,
  confirmNextEpisodePrompt,
  resetNextEpisodePromptRuntime,
  showNextEpisodePrompt,
  type NextEpisodePromptHost,
  type NextEpisodePromptNode,
  type NextEpisodeTarget
} from "./nextEpisodePrompt";

function createNode(): NextEpisodePromptNode & { classes: Set<string> } {
  const classes = new Set<string>();
  return {
    textContent: "",
    classes,
    classList: {
      add(name: string) {
        classes.add(name);
      },
      remove(name: string) {
        classes.delete(name);
      }
    }
  };
}

function createHarness() {
  const state = createAppState();
  state.screen = "player";
  state.playerMode = "vod";
  const prompt = createNode();
  const kicker = createNode();
  const title = createNode();
  const play = createNode();
  const cancel = createNode();
  const count = createNode();
  const focus = vi.fn();
  const restorePlayerFocus = vi.fn();
  const startNext = vi.fn();
  const host: NextEpisodePromptHost = {
    state,
    getPrompt: () => prompt,
    getElements: () => ({ kicker, title, play, cancel, count }),
    focus,
    restorePlayerFocus,
    formatTarget: vi.fn(() => "Episodio 4"),
    startNext
  };
  attachNextEpisodePrompt(host);
  return {
    state,
    prompt,
    kicker,
    title,
    play,
    cancel,
    count,
    focus,
    restorePlayerFocus,
    startNext,
    host
  };
}

const target: NextEpisodeTarget = {
  kind: "episode",
  seasonIndex: 0,
  episode: { id: "e4", number: 4 }
};

afterEach(() => {
  resetNextEpisodePromptRuntime();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("nextEpisodePrompt", () => {
  it("offers the prompt only near the end and outside the guard", () => {
    const state = createAppState();
    state.screen = "player";
    state.playerMode = "vod";
    expect(canOfferNextEpisode(state, 0, 100)).toBe(false);
    expect(canOfferNextEpisode(state, 95, 100)).toBe(true);
    expect(canOfferNextEpisode(state, 95, 59)).toBe(false);
    state.nextEpisodeOpen = true;
    expect(canOfferNextEpisode(state, 95, 100)).toBe(false);
    state.nextEpisodeOpen = false;
    state.nextEpisodeDismissed = true;
    expect(canOfferNextEpisode(state, 95, 100)).toBe(false);
    state.nextEpisodeDismissed = false;
    state.nextEpisodeGuardUntil = 2000;
    expect(canOfferNextEpisode(state, 95, 100, 1000)).toBe(false);
    expect(canOfferNextEpisode(state, 95, 100, 2000)).toBe(true);
  });

  it("shows the prompt, focuses the action and advances after the countdown", () => {
    vi.useFakeTimers();
    const harness = createHarness();

    expect(showNextEpisodePrompt(target, 3)).toBe(true);

    expect(harness.state.nextEpisodeOpen).toBe(true);
    expect(harness.state.nextEpisodeCountdown).toBe(3);
    expect(harness.kicker.textContent).toBe("Siguiente episodio");
    expect(harness.title.textContent).toBe("Episodio 4");
    expect(harness.prompt.classes.has("is-active")).toBe(true);
    expect(harness.focus).toHaveBeenCalledWith(harness.play);
    expect(harness.count.textContent).toBe("3");

    vi.advanceTimersByTime(2000);
    expect(harness.state.nextEpisodeCountdown).toBe(1);
    expect(harness.startNext).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(harness.startNext).toHaveBeenCalledWith(target);
    expect(harness.state.nextEpisodeOpen).toBe(false);
    expect(harness.prompt.classes.has("is-active")).toBe(false);
  });

  it("uses seven seconds by default and updates the countdown", () => {
    vi.useFakeTimers();
    const harness = createHarness();
    showNextEpisodePrompt(target);
    expect(harness.state.nextEpisodeCountdown).toBe(7);
    vi.advanceTimersByTime(1000);
    expect(harness.count.textContent).toBe("6");
    expect(harness.startNext).not.toHaveBeenCalled();
    vi.advanceTimersByTime(6000);
    expect(harness.startNext).toHaveBeenCalledWith(target);
  });

  it("closes without starting and restores focus", () => {
    vi.useFakeTimers();
    const harness = createHarness();
    showNextEpisodePrompt(target);

    expect(closeNextEpisodePrompt(true)).toBe(true);

    expect(harness.state.nextEpisodeOpen).toBe(false);
    expect(harness.state.nextEpisodeTimer).toBeNull();
    expect(harness.state.nextEpisodeTarget).toBeNull();
    expect(harness.prompt.classes.has("is-active")).toBe(false);
    expect(harness.restorePlayerFocus).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(7000);
    expect(harness.startNext).not.toHaveBeenCalled();
  });

  it("cancels and marks the prompt as dismissed", () => {
    const harness = createHarness();
    showNextEpisodePrompt(target);

    expect(cancelNextEpisodePrompt()).toBe(true);

    expect(harness.state.nextEpisodeDismissed).toBe(true);
    expect(harness.state.nextEpisodeOpen).toBe(false);
    expect(harness.restorePlayerFocus).toHaveBeenCalledTimes(1);
  });

  it("confirms from the action and clears the timer", () => {
    vi.useFakeTimers();
    const harness = createHarness();
    showNextEpisodePrompt(target);

    harness.play._activate?.();

    expect(harness.startNext).toHaveBeenCalledWith(target);
    expect(harness.state.nextEpisodeTimer).toBeNull();
    vi.advanceTimersByTime(7000);
    expect(harness.startNext).toHaveBeenCalledTimes(1);
  });

  it("does not show twice or after being dismissed", () => {
    const harness = createHarness();
    showNextEpisodePrompt(target);
    expect(showNextEpisodePrompt(target)).toBe(false);
    closeNextEpisodePrompt(false);
    harness.state.nextEpisodeDismissed = true;
    expect(showNextEpisodePrompt(target)).toBe(false);
  });

  it("starts the next target immediately when the prompt is unavailable", () => {
    const harness = createHarness();
    vi.spyOn(harness.host, "getPrompt").mockReturnValue(null);

    expect(showNextEpisodePrompt(target)).toBe(true);

    expect(harness.startNext).toHaveBeenCalledWith(target);
    expect(harness.state.nextEpisodeOpen).toBe(false);
  });

  it("returns false when the runtime is not attached", () => {
    resetNextEpisodePromptRuntime();
    expect(showNextEpisodePrompt(target)).toBe(false);
    expect(closeNextEpisodePrompt(false)).toBe(false);
    expect(cancelNextEpisodePrompt()).toBe(false);
    expect(confirmNextEpisodePrompt()).toBe(false);
  });
});
