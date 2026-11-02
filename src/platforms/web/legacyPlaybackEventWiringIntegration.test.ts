import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");

const snippet = source.match(
  / {4}function legacyWirePlaybackVideoEvents\(target, handlers\) \{[\s\S]*?(?= {4}function legacyDevServiceUrl)/
)?.[0];

const events = [
  "error",
  "loadeddata",
  "canplay",
  "loadedmetadata",
  "durationchange",
  "playing",
  "ended",
  "timeupdate",
  "pause",
  "play",
  "waiting",
  "stalled",
  "seeking",
  "seeked",
  "progress"
];

describe("legacy playback event wiring integration", () => {
  it("keeps video and HLS handlers wired through Core", () => {
    expect(source).toMatch(/legacyWirePlaybackVideoEvents\(we, \{/);
    expect(source).toMatch(/legacyWireHlsPlaybackEvents\(hls, window\.Hls\.Events/);
  });

  it.each([true, false])("registers player and HLS handlers (core available: %s)", (withCore) => {
    expect(snippet).toBeTruthy();
    const runtime = runInNewContext(
      `${snippet}\n({ legacyWirePlaybackVideoEvents, legacyWireHlsPlaybackEvents })`,
      { window: { TutyCore: withCore ? core : undefined } }
    ) as {
      legacyWirePlaybackVideoEvents(
        target: Record<string, unknown>,
        handlers: Record<string, unknown>
      ): void;
      legacyWireHlsPlaybackEvents(
        hls: { on(event: string, handler: (...args: unknown[]) => void): unknown },
        events: { ERROR: string; MANIFEST_PARSED: string },
        onError: (...args: unknown[]) => void,
        onManifest: (...args: unknown[]) => void
      ): void;
    };

    const handler = () => {};
    const videoTarget: Record<string, unknown> = {};
    const videoHandlers = Object.fromEntries(events.map((event) => [event, handler]));
    runtime.legacyWirePlaybackVideoEvents(videoTarget, videoHandlers);
    for (const event of events) {
      expect(videoTarget["on" + event]).toBe(handler);
    }

    const calls: Array<{ event: string; handler: (...args: unknown[]) => void }> = [];
    const hls = {
      on(event: string, registered: (...args: unknown[]) => void) {
        calls.push({ event, handler: registered });
        return hls;
      }
    };
    const onError = () => {};
    const onManifest = () => {};
    runtime.legacyWireHlsPlaybackEvents(
      hls,
      { ERROR: "hls-error", MANIFEST_PARSED: "manifest" },
      onError,
      onManifest
    );
    expect(calls).toEqual([
      { event: "hls-error", handler: onError },
      { event: "manifest", handler: onManifest }
    ]);
  });
});
