import { describe, expect, it } from "vitest";
import {
  PLAYBACK_VIDEO_EVENTS,
  wireHlsPlaybackEvents,
  wirePlaybackVideoEvents,
  type PlaybackVideoHandlers
} from "./playbackEventWiring";

const noop = () => {};

describe("playback event wiring", () => {
  it("assigns every player event to the video element", () => {
    const handlers = Object.fromEntries(
      PLAYBACK_VIDEO_EVENTS.map((event) => [event, noop])
    ) as PlaybackVideoHandlers;
    const target: Record<string, unknown> = {};

    wirePlaybackVideoEvents(target, handlers);

    for (const event of PLAYBACK_VIDEO_EVENTS) {
      expect(target["on" + event]).toBe(noop);
    }
  });

  it("registers HLS error and manifest handlers", () => {
    const calls: Array<{ event: string; handler: (...args: unknown[]) => void }> = [];
    const hls = {
      on(event: string, handler: (...args: unknown[]) => void) {
        calls.push({ event, handler });
        return hls;
      }
    };
    const onError = () => {};
    const onManifest = () => {};

    wireHlsPlaybackEvents(hls, { ERROR: "error", MANIFEST_PARSED: "manifest" }, onError, onManifest);

    expect(calls).toEqual([
      { event: "error", handler: onError },
      { event: "manifest", handler: onManifest }
    ]);
  });
});
