import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyPlayerSubtitleStyle,
  attachPlayerSubtitles,
  getPlayerSubtitleEnd,
  loadPlayerSubtitle,
  renderPlayerSubtitle,
  resetPlayerSubtitleRuntime,
  resetPlayerSubtitles,
  type PlayerSubtitleHost,
  type SubtitleCue
} from "./playerSubtitles";

function createHarness() {
  const classes = new Set<string>();
  const container = {
    innerHTML: "",
    classList: {
      add(...names: string[]) {
        names.forEach((name) => classes.add(name));
      },
      remove(...names: string[]) {
        names.forEach((name) => classes.delete(name));
      }
    }
  };
  const pending: Array<(text: string | null) => void> = [];
  const fetchText = vi.fn((_url: string, done: (text: string | null) => void) => {
    pending.push(done);
  });
  const cues: SubtitleCue[] = [
    { start: 0, end: 2, text: "Hola" },
    { start: 3, end: 5, text: "Mundo" }
  ];
  const host: PlayerSubtitleHost = {
    getContainer: () => container,
    fetchText,
    parseCues: vi.fn(() => cues),
    findCue: vi.fn((list: SubtitleCue[], position: number) =>
      list.find((cue: SubtitleCue) => position >= cue.start && position <= cue.end) || null)
  };
  attachPlayerSubtitles(host);
  return {
    host,
    container,
    classes,
    cues,
    fetchText,
    respond(text: string | null, index = pending.length - 1) {
      pending[index]?.(text);
    }
  };
}

afterEach(() => {
  resetPlayerSubtitleRuntime();
  vi.clearAllMocks();
});

describe("playerSubtitles", () => {
  it("loads a subtitle track and renders the active cue", () => {
    const harness = createHarness();
    loadPlayerSubtitle({ url: "http://example.com/es.vtt" });
    expect(harness.fetchText).toHaveBeenCalledWith("http://example.com/es.vtt", expect.any(Function));

    harness.respond("WEBVTT");
    expect(harness.host.parseCues).toHaveBeenCalledWith("WEBVTT");
    expect(getPlayerSubtitleEnd()).toBe(5);

    renderPlayerSubtitle(1, true);
    expect(harness.container.innerHTML).toBe('<span class="player-subtitles-text">Hola</span>');
    renderPlayerSubtitle(4, true);
    expect(harness.container.innerHTML).toBe('<span class="player-subtitles-text">Mundo</span>');
  });

  it("clears the overlay when disabled or outside a cue", () => {
    const harness = createHarness();
    loadPlayerSubtitle({ url: "http://example.com/es.vtt" });
    harness.respond("WEBVTT");
    renderPlayerSubtitle(1, true);

    renderPlayerSubtitle(1, false);
    expect(harness.container.innerHTML).toBe("");

    renderPlayerSubtitle(1, true);
    renderPlayerSubtitle(9, true);
    expect(harness.container.innerHTML).toBe("");
  });

  it("ignores stale responses and clears cues when the track is removed", () => {
    const harness = createHarness();
    loadPlayerSubtitle({ url: "http://example.com/old.vtt" });
    loadPlayerSubtitle({ url: "http://example.com/new.vtt" });
    harness.respond("OLD", 0);
    expect(harness.host.parseCues).not.toHaveBeenCalledWith("OLD");

    harness.respond("NEW", 1);
    expect(harness.host.parseCues).toHaveBeenCalledWith("NEW");
    expect(getPlayerSubtitleEnd()).toBe(5);

    loadPlayerSubtitle(null);
    expect(getPlayerSubtitleEnd()).toBe(0);
    expect(harness.container.innerHTML).toBe("");
  });

  it("resets cues and the overlay", () => {
    const harness = createHarness();
    loadPlayerSubtitle({ url: "http://example.com/es.vtt" });
    harness.respond("WEBVTT");
    renderPlayerSubtitle(1, true);

    expect(resetPlayerSubtitles()).toBe(true);

    expect(harness.container.innerHTML).toBe("");
    expect(getPlayerSubtitleEnd()).toBe(0);
    harness.respond("LATE", 0);
    expect(harness.host.parseCues).not.toHaveBeenCalledWith("LATE");
  });

  it("applies size and color classes", () => {
    const harness = createHarness();
    harness.classes.add("size-big");
    harness.classes.add("color-yellow");

    applyPlayerSubtitleStyle("small", "black");

    expect(harness.classes.has("size-big")).toBe(false);
    expect(harness.classes.has("color-yellow")).toBe(false);
    expect(harness.classes.has("size-small")).toBe(true);
    expect(harness.classes.has("color-black")).toBe(true);
  });

  it("returns false when the runtime is not attached", () => {
    resetPlayerSubtitleRuntime();
    expect(loadPlayerSubtitle({ url: "x" })).toBe(false);
    expect(renderPlayerSubtitle(0, true)).toBe(false);
    expect(applyPlayerSubtitleStyle("normal", "white")).toBe(false);
    expect(resetPlayerSubtitles()).toBe(false);
    expect(getPlayerSubtitleEnd()).toBe(0);
  });
});
