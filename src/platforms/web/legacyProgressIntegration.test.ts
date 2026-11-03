import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");
const format = source.match(/ {4}function legacyFormatPlaybackTime\(value\) \{[\s\S]*?(?= {4}function legacyParsePlaybackDuration)/)?.[0];
const parse = source.match(/ {4}function legacyParsePlaybackDuration\(value\) \{[\s\S]*?(?= {4}function legacyInferEpisodeDuration)/)?.[0];
const infer = source.match(/ {4}function legacyInferEpisodeDuration\(episodes, current\) \{[\s\S]*?(?= {4}function legacyPlaybackPercent)/)?.[0];
const percent = source.match(/ {4}function legacyPlaybackPercent\(value, total\) \{[\s\S]*?(?= {4}function legacyResolvePlaybackDuration)/)?.[0];
const resolve = source.match(/ {4}function legacyResolvePlaybackDuration\(candidates, series, position\) \{[\s\S]*?(?= {4}function legacyDevServiceUrl)/)?.[0];
const display = source.match(/ {4}function ki\(e\) \{[\s\S]*?(?= {4}function Mi\(e\))/)?.[0];
const parseLegacy = source.match(/ {4}function Mi\(e\) \{[\s\S]*?(?= {4}var Ii = null;)/)?.[0];
const progress = source.match(/ {4}function Ei\(e, t\) \{[\s\S]*?(?= {4}function qi\(e\))/)?.[0];
const total = source.match(/ {4}function Zn\(\) \{[\s\S]*?(?= {4}function er\(e\))/)?.[0];
const progressHelpers = source.match(/ {4}function legacyShouldPersistPlaybackHistory\([\s\S]*?(?= {4}function legacyFormatPlaybackTime)/)?.[0];
const scrub = source.match(/ {4}function ir\(e\) \{[\s\S]*?(?= {4}function ar\(\))/)?.[0];
const probe = source.match(/ {4}function probeRelayDuration\(source\) \{[\s\S]*?(?= {4}function er\(e\))/)?.[0];

function element() {
  return { textContent: "", style: {} as Record<string, string> };
}

describe("legacy playback progress", () => {
  it.each([true, false])("uses the absolute relay duration for the seek bar (core available: %s)", (withCore) => {
    expect(format && parse && infer && percent && resolve && display && parseLegacy && progress && total && progressHelpers).toBeTruthy();
    const Ie = element();
    const Te = element();
    const qe = element();
    const context = {
      window: { TutyCore: withCore ? core : undefined },
      Ie, Te, qe, De: null, Oe: null,
      we: { duration: 3600, buffered: { length: 0 } },
      j: { playerItem: { duration: "2 h" as unknown, episodes: [] as unknown[] }, playerEpisode: null as unknown },
      Da: [] as unknown[], Hn: "", zn: 0, Hd: 0, Je: false, Qe: 0, jn: null, Vn: 0,
      subtitleEnd: () => 0,
      S: () => false,
      r: (value: number) => value < 10 ? `0${value}` : String(value)
    };
    const runtime = runInNewContext(
      `${format}\n${parse}\n${infer}\n${percent}\n${resolve}\n${display}\n${parseLegacy}\n${progressHelpers}\n${total}\n${progress}\n({ Ei, Zn })`,
      context
    ) as { Ei(position: number, duration: number): void; Zn(): number };

    runtime.Ei(90, 5400);
    expect(Ie.textContent).toBe("00:01:30");
    expect(Te.textContent).toBe("01:30:00");
    expect(qe.style.width).toBe("1.67%");

    context.Hn = "http://127.0.0.1:8787/s/abc.mp4";
    context.zn = 1800;
    runtime.Ei(1890, 3600);
    expect(Ie.textContent).toBe("00:31:30");
    expect(Te.textContent).toBe("02:00:00");
    expect(qe.style.width).toBe("26.25%");

    context.j.playerItem.duration = "";
    runtime.Ei(1890, 3600);
    expect(Te.textContent).toBe("01:30:00");
    expect(qe.style.width).toBe("35.00%");

    context.j.playerItem.duration = "2 h";
    context.j.playerEpisode = { duration: "45 min" };
    runtime.Ei(1890, 3600);
    expect(Te.textContent).toBe("00:45:00");
    expect(qe.style.width).toBe("70.00%");

    context.j.playerEpisode = null;
    expect(runtime.Zn()).toBe(7200);
    context.j.playerItem.duration = "";
    expect(runtime.Zn()).toBe(5400);
    context.Hn = "";
    context.we.duration = 3600;
    expect(runtime.Zn()).toBe(3600);

    context.Hn = "http://127.0.0.1:8787/s/abc.mp4";
    context.we.duration = Infinity;
    context.j.playerEpisode = { duration: "" };
    context.j.playerItem.episodes = [
      { duration: "00:50:00" },
      { duration: "00:50:00" },
      { duration: "00:52:00" }
    ];
    runtime.Ei(100, 0);
    expect(Te.textContent).toBe("00:50:00");
    expect(qe.style.width).toBe("3.33%");
    expect(runtime.Zn()).toBe(3000);

    context.Hd = 2900;
    context.j.playerItem.episodes = [];
    runtime.Ei(100, 0);
    expect(Te.textContent).toBe("00:48:20");
    expect(qe.style.width).toBe("3.45%");
    expect(runtime.Zn()).toBe(2900);

    context.Je = true;
    context.Qe = 120;
    context.jn = null;
    context.Vn = 0;
    runtime.Ei(300, 2900);
    expect(Ie.textContent).toBe("00:05:00");
    context.Vn = 10;
    runtime.Ei(300, 2900);
    expect(Ie.textContent).toBe("00:02:00");
  });

  it("steps the focused seek bar and requests the seek automatically", () => {
    expect(scrub).toBeDefined();
    const calls: Array<[number, number]> = [];
    const oi = vi.fn();
    const context = {
      Je: true, Qe: 100, jn: null, Vn: 0,
      Zn: () => 1000,
      Yn: () => 100,
      Ei: (position: number, duration: number) => { calls.push([position, duration]); },
      Oi: (delta: number) => { oi(delta); context.Vn += delta; }
    };
    const runtime = runInNewContext(`${scrub}\n({ ir })`, context) as { ir(direction: number): void };

    runtime.ir(1);
    expect(context.Qe).toBe(110);
    expect(calls[calls.length - 1]).toEqual([110, 1000]);
    expect(oi).toHaveBeenLastCalledWith(10);
    runtime.ir(1);
    expect(context.Qe).toBe(120);
    expect(oi).toHaveBeenLastCalledWith(10);
    runtime.ir(-1);
    expect(context.Qe).toBe(110);
    expect(oi).toHaveBeenLastCalledWith(-10);
    context.Qe = 995;
    runtime.ir(1);
    expect(context.Qe).toBe(999);
    expect(oi).toHaveBeenLastCalledWith(10);
    expect(oi).toHaveBeenCalledTimes(4);
  });

  it("polls the relay duration endpoint and refreshes the bar", () => {
    expect(probe).toBeDefined();
    const responses = [0, 2900];
    const urls: string[] = [];
    const timers: Array<() => void> = [];
    const Ei = vi.fn();
    class FakeXHR {
      timeout = 0;
      responseText = "";
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      ontimeout: (() => void) | null = null;
      open(_method: string, url: string) { urls.push(url); }
      send() {
        this.responseText = JSON.stringify({ duration: responses.shift() ?? 0 });
        this.onload?.();
      }
      abort() {}
    }
    const context = {
      Hn: "http://127.0.0.1:8787/s/ab12.mp4",
      Hd: 0,
      j: { playerMode: "vod" },
      Ei, Yn: () => 100, Zn: () => 2900,
      XMLHttpRequest: FakeXHR,
      legacyRelayDurationEndpoint: (url: string) => url.replace(/\/s\/([0-9a-f]+)\.mp4.*$/i, "/duration/$1"),
      setTimeout: (callback: () => void) => { timers.push(callback); return 1; }
    };
    const runtime = runInNewContext(`${probe}\n({ probeRelayDuration })`, context) as {
      probeRelayDuration(source: string): void;
    };

    runtime.probeRelayDuration(context.Hn);
    expect(urls).toEqual(["http://127.0.0.1:8787/duration/ab12"]);
    expect(context.Hd).toBe(0);
    expect(timers).toHaveLength(1);
    timers[0]?.();
    expect(context.Hd).toBe(2900);
    expect(Ei).toHaveBeenLastCalledWith(100, 2900);
  });
});
