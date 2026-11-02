import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const appSource = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");
const helpers = appSource.match(/ {4}function legacyNavigationAction\(e\) \{[\s\S]*?(?= {4}function Q\(\))/)?.[0];
const stop = appSource.match(/ {4}function ar\(\) \{[\s\S]*?(?= {4}function nr\(e\))/)?.[0];
const open = appSource.match(/ {4}function rr\(e, t\) \{[\s\S]*?(?= {4}function or\(e, t\))/)?.[0];
const seek = appSource.match(/ {4}function Kn\(\) \{[\s\S]*?(?= {4}function Oi\(e\))/)?.[0];
const preview = appSource.match(/ {4}function Nt\(\) \{[\s\S]*?(?= {4}function Ut\(e, t\))/)?.[0];

afterEach(() => vi.restoreAllMocks());

function createRuntime(withCore: boolean, isTv: boolean, hlsEnabled: boolean) {
  expect(helpers && stop && open && seek).toBeTruthy();
  const calls: string[] = [];
  const scheduled: Array<() => void> = [];
  const listeners: Record<string, (event: unknown, data: { fatal: boolean; type: string } | null) => void> = {};
  const sources: Array<Record<string, string>> = [];
  class Hls {
    static Events = { ERROR: "error", MANIFEST_PARSED: "manifest" };
    static ErrorTypes = { NETWORK_ERROR: "network", MEDIA_ERROR: "media" };
    static isSupported() { return hlsEnabled; }
    on(event: string, listener: typeof listeners[string]) { listeners[event] = listener; }
    loadSource(url: string) { calls.push(`hls-source:${url}`); }
    attachMedia() { calls.push("hls-attach"); }
    startLoad() { calls.push("hls-retry"); }
    recoverMediaError() { calls.push("hls-recover"); }
    destroy() { calls.push("hls-destroy"); }
  }
  const video = {
    src: "", currentTime: 0, duration: 100, firstChild: null,
    error: null as { code: number } | null, mediaOption: null as unknown,
    onloadedmetadata: () => {}, onerror: () => {},
    play: vi.fn(() => { calls.push("play"); return Promise.resolve(); }),
    pause: vi.fn(() => { calls.push("pause"); }),
    load: vi.fn(() => { calls.push("load"); }),
    removeAttribute: vi.fn((attr: string) => { calls.push(`remove:${attr}`); }),
    classList: { add: vi.fn(), remove: vi.fn() }
  };
  const exposedCore = {
    ...core,
    limitSeekPosition: vi.fn(core.limitSeekPosition),
    handleHlsError: vi.fn(core.handleHlsError),
    selectNativeRetry: vi.fn(core.selectNativeRetry),
    isRelayStreamMode: vi.fn(core.isRelayStreamMode),
    shouldForceRelay: vi.fn(core.shouldForceRelay),
    applyRelayResumeStart: vi.fn(core.applyRelayResumeStart),
    destroyLegacyHls: vi.fn(core.destroyLegacyHls),
    scheduleGuardedRetry: vi.fn(core.scheduleGuardedRetry)
  };
  const window = { TutyCore: withCore ? exposedCore : undefined, Hls, __tutyHls: null as Hls | null };
  const j = {
    playerMode: "vod", playerItem: { id: "movie-1", isHls: true, streamMime: "" }, playerEpisode: null,
    resumePosition: 21, streamMode: "normal", streamError: "", noHistorySave: false
  };
  const saveHistory = vi.fn();
  const abort = vi.fn();
  const scope = {
    window, navigator: { userAgent: isTv ? "SmartTV" : "Desktop" }, we: video, j,
    document: { createElement() {
      const attrs: Record<string, string> = {};
      sources.push(attrs);
      return { setAttribute(key: string, value: string) { attrs[key] = value; } };
    } },
    $n: vi.fn(), nr: vi.fn(), qi: vi.fn(), Ti: vi.fn(), Qn: vi.fn(), mn: vi.fn(),
    ja: (item: { id: string }) => item.id,
    $a: vi.fn(() => { j.streamMode = "smooth"; }), Tn: vi.fn(), Va: "",
    Ta: saveHistory, q: abort, Ei: vi.fn(), Mi: vi.fn(), xe: null,
    Hn: "", zn: 0, Vn: 0, jn: null, Jn: null, Gn: false, Un: "", Fn: "", Bn: 0, cr: 1,
    probeRelayDuration: vi.fn(),
    setTimeout: vi.fn((callback: () => void) => { scheduled.push(callback); return 1; }), clearTimeout: vi.fn(),
    setInterval: vi.fn(), clearInterval: vi.fn()
  };
  Object.assign(video, { appendChild: vi.fn() });
  const runtime = runInNewContext(
    `${helpers}\n${stop}\n${open}\n${seek}\n({ rr, ar, Kn, legacyRelayStreamMode, legacyForceRelay, legacyRelayResumeStart })`,
    scope
  ) as {
    rr(url: string, options?: { nativeHls: boolean }): void;
    ar(): void;
    Kn(): void;
    legacyRelayStreamMode(mode: string): boolean;
    legacyForceRelay(mode: string, resumeAt: number): boolean;
    legacyRelayResumeStart(url: string, resumeAt: number): { url: string; consumed: boolean };
  };
  return { runtime, video, j, window, calls, listeners, sources, scope, saveHistory, abort, scheduled, exposedCore };
}

describe("legacy player integration", () => {
  it.each([true, false])("preserves native HLS, resume and stop (core available: %s)", (withCore) => {
    const { runtime, video, j, calls, sources, saveHistory, abort } = createRuntime(withCore, true, true);
    const seekSpy = vi.spyOn(core.player, "seekTo");
    const loadSpy = vi.spyOn(core.player, "reload");
    runtime.rr("https://example.com/live.m3u8");
    expect(sources[0]?.src).toBe("https://example.com/live.m3u8");
    expect(sources[0]?.type).toContain("application/vnd.apple.mpegurl;mediaOption=");
    expect(video.mediaOption).toMatchObject({ mediaTransportType: "HLS" });
    expect(calls.slice(-2)).toEqual(["load", "play"]);
    video.onloadedmetadata();
    expect(video.currentTime).toBe(21);
    expect(j.resumePosition).toBe(0);
    runtime.ar();
    expect(video.currentTime).toBe(0);
    expect(video.src).toBe("");
    expect(saveHistory).toHaveBeenLastCalledWith(21, 100, true);
    expect(abort).toHaveBeenCalledTimes(2);
    expect(seekSpy).toHaveBeenCalledTimes(withCore ? 4 : 0);
    expect(loadSpy).toHaveBeenCalledTimes(withCore ? 1 : 0);
  });

  it.each([true, false])("preserves HLS.js ordering, recovery and cleanup (core available: %s)", (withCore) => {
    const { runtime, calls, listeners, window, video, exposedCore } = createRuntime(withCore, false, true);
    const hlsSpy = vi.spyOn(core.player, "loadHls");
    runtime.rr("https://example.com/live.m3u8");
    expect(calls.indexOf("hls-source:https://example.com/live.m3u8")).toBeLessThan(calls.indexOf("hls-attach"));
    expect(calls.indexOf("hls-attach")).toBeLessThan(calls.indexOf("play"));
    listeners.error?.(null, { fatal: true, type: "network" });
    listeners.error?.(null, { fatal: true, type: "media" });
    expect(calls).toContain("hls-retry");
    expect(calls).toContain("hls-recover");
    listeners.manifest?.(null, { fatal: false, type: "" });
    expect(video.currentTime).toBe(21);
    runtime.ar();
    expect(calls).toContain("hls-destroy");
    expect(window.__tutyHls).toBeNull();
    expect(hlsSpy).toHaveBeenCalledTimes(withCore ? 1 : 0);
    expect(exposedCore.destroyLegacyHls).toHaveBeenCalledTimes(withCore ? 3 : 0);
  });

  it.each([true, false])("finishes player cleanup if HLS destruction fails (core available: %s)", (withCore) => {
    const { runtime, window, video } = createRuntime(withCore, false, true);
    runtime.rr("https://example.com/live.m3u8");
    if (!window.__tutyHls) throw new Error("HLS was not created");
    window.__tutyHls.destroy = () => { throw new Error("destroy failed"); };
    video.currentTime = 42;
    expect(() => runtime.ar()).not.toThrow();
    expect(window.__tutyHls).toBeNull();
    expect(video.currentTime).toBe(0);
    expect(video.src).toBe("");
  });

  it.each([true, false])("preserves fatal and nonfatal HLS error behavior (core available: %s)", (withCore) => {
    const { runtime, listeners, j, scope, exposedCore } = createRuntime(withCore, false, true);
    runtime.rr("https://example.com/live.m3u8");
    listeners.error?.(null, null);
    listeners.error?.(null, { fatal: false, type: "other" });
    expect(j.streamError).toBe("");
    listeners.error?.(null, { fatal: true, type: "other" });
    expect(j.streamError).toBe("No se pudo abrir el stream (HLS)");
    expect(scope.nr).toHaveBeenLastCalledWith("No se pudo abrir el stream (HLS)");
    expect(exposedCore.handleHlsError).toHaveBeenCalledTimes(withCore ? 3 : 0);
  });

  it.each([true, false])("preserves seek bounds for local and relay playback (core available: %s)", (withCore) => {
    const local = createRuntime(withCore, false, false);
    local.video.currentTime = 2;
    local.video.duration = 100;
    local.scope.Vn = -20;
    local.runtime.Kn();
    expect(local.video.currentTime).toBe(0);
    local.video.currentTime = 95;
    local.scope.Vn = 20;
    local.runtime.Kn();
    expect(local.video.currentTime).toBe(99);
    local.video.duration = 0;
    local.scope.Vn = 20;
    local.runtime.Kn();
    expect(local.video.currentTime).toBe(119);
    expect(local.exposedCore.limitSeekPosition).toHaveBeenCalledTimes(withCore ? 3 : 0);

    const relay = createRuntime(withCore, false, false);
    relay.j.playerItem.isHls = false;
    relay.scope.Hn = "http://127.0.0.1:8787/s/ab12.mp4";
    relay.scope.zn = 80;
    relay.video.currentTime = 15;
    relay.scope.Vn = 20;
    relay.runtime.Kn();
    expect(relay.scope.Fn).toBe("http://127.0.0.1:8787/s/ab12.mp4?start=98");
    expect(relay.exposedCore.limitSeekPosition).toHaveBeenCalledTimes(withCore ? 1 : 0);
  });

  it.each([true, false])("preserves direct MP4 and local seek (core available: %s)", (withCore) => {
    const { runtime, video, j, scope } = createRuntime(withCore, false, false);
    j.playerItem.isHls = false;
    runtime.rr("https://example.com/movie.mp4");
    expect(video.src).toBe("https://example.com/movie.mp4");
    expect(video.load).not.toHaveBeenCalled();
    video.currentTime = 20;
    scope.Vn = 15;
    runtime.Kn();
    expect(video.currentTime).toBe(35);
  });

  it.each([true, false])("retries a failed live HLS stream natively (core available: %s)", (withCore) => {
    const { runtime, video, j, calls, sources, scheduled, window, exposedCore } = createRuntime(withCore, false, true);
    j.playerMode = "live";
    runtime.rr("https://example.com/live.m3u8");
    video.error = { code: 4 };
    video.onerror();
    expect(scheduled).toHaveLength(1);
    scheduled[0]?.();
    expect(calls).toContain("hls-destroy");
    expect(window.__tutyHls).toBeNull();
    expect(sources[0]?.type).toBe("application/vnd.apple.mpegurl");
    expect(video.mediaOption).toBeNull();
    expect(video.load).toHaveBeenCalledOnce();
    expect(exposedCore.selectNativeRetry).toHaveBeenCalledTimes(withCore ? 1 : 0);
    expect(exposedCore.scheduleGuardedRetry).toHaveBeenCalledTimes(withCore ? 1 : 0);
  });

  it.each([true, false])("retries a VOD failure once and rejects stale retry callbacks (core available: %s)", (withCore) => {
    const first = createRuntime(withCore, false, false);
    first.j.playerItem.isHls = false;
    first.runtime.rr("https://example.com/movie.mp4");
    first.video.error = { code: 4 };
    first.video.onerror();
    expect(first.scope.$a).toHaveBeenCalledWith(first.j.playerItem, true);
    expect(first.exposedCore.selectNativeRetry).toHaveBeenCalledTimes(withCore ? 1 : 0);
    expect(first.scope.Va).toBe("movie-1");
    first.scheduled[0]?.();
    expect(first.scope.Tn).toHaveBeenCalledOnce();
    first.j.streamMode = "normal";
    first.video.onerror();
    expect(first.j.streamError).toBe("No se pudo abrir el stream (código 4)");
    expect(first.scope.$a).toHaveBeenCalledOnce();

    const stale = createRuntime(withCore, false, false);
    stale.runtime.rr("https://example.com/movie.mp4");
    stale.video.error = { code: 4 };
    stale.video.onerror();
    stale.j.playerItem = { id: "movie-2", isHls: false, streamMime: "" };
    stale.scheduled[0]?.();
    expect(stale.scope.Tn).not.toHaveBeenCalled();
  });

  it.each([true, false])("does not run stale live retries or retry other error codes (core available: %s)", (withCore) => {
    const live = createRuntime(withCore, false, true);
    live.j.playerMode = "live";
    live.runtime.rr("https://example.com/live.m3u8");
    live.video.error = { code: 4 };
    live.video.onerror();
    live.scope.cr++;
    live.scheduled[0]?.();
    expect(live.sources).toHaveLength(0);

    const vod = createRuntime(withCore, false, false);
    vod.runtime.rr("https://example.com/movie.mp4");
    vod.video.error = { code: 3 };
    vod.video.onerror();
    expect(vod.scheduled).toHaveLength(0);
    expect(vod.scope.$a).not.toHaveBeenCalled();
    expect(vod.j.streamError).toBe("No se pudo abrir el stream (código 3)");
  });

  it.each([true, false])("preserves relay seek and synchronous play errors (core available: %s)", (withCore) => {
    const { runtime, video, j, scope } = createRuntime(withCore, false, false);
    j.playerItem.isHls = false;
    scope.Hn = "http://127.0.0.1:8787/s/ab12.mp4";
    scope.zn = 30;
    scope.Vn = 15;
    video.currentTime = 20;
    video.play.mockImplementationOnce(() => { throw new Error("blocked"); });
    runtime.Kn();
    expect(scope.Fn).toBe("http://127.0.0.1:8787/s/ab12.mp4?start=65");
    expect(scope.zn).toBe(65);
    expect(j.streamError).toBe("Pulsa OK para iniciar la reproducción");
  });

  it.each([
    [true, true], [true, false], [false, true], [false, false]
  ])("preserves preview load and cleanup (core: %s, HLS.js: %s)", (withCore, useHls) => {
    expect(preview).toBeDefined();
    const calls: string[] = [];
    const events: Record<string, () => void> = {};
    const scheduled: Array<() => void> = [];
    class Hls {
      static Events = { MANIFEST_PARSED: "manifest", ERROR: "error" };
      static isSupported() { return true; }
      on(event: string, listener: () => void) { events[event] = listener; }
      loadSource(url: string) { calls.push(`source:${url}`); }
      attachMedia() { calls.push("attach"); }
      destroy() { calls.push("destroy"); }
    }
    const video = {
      src: "", currentTime: 0, canPlayType: () => "",
      pause: () => calls.push("pause"), play: () => { calls.push("play"); },
      load: () => calls.push("load"), removeAttribute: () => calls.push("remove")
    };
    const window = { TutyCore: withCore ? core : undefined, Hls, __tutyPreviewHls: null as Hls | null };
    const scope = {
      window, navigator: { userAgent: useHls ? "Desktop" : "SmartTV" },
      Et: video, te: { classList: { add() {}, remove() {}, contains() { return false; } } },
      qt: { textContent: "" }, j: { screen: "home", tab: 0, channel: 0 }, F: [],
      Ot: 0, At: "", Dt: null,
      setTimeout: (callback: () => void) => { scheduled.push(callback); return 1; },
      clearTimeout: () => {},
      q: (_method: string, _args: unknown, callback: (error: null, result: object) => void) =>
        callback(null, { url: "https://example.com/preview.m3u8", isHls: true })
    };
    const runtime = runInNewContext(`${helpers}\n${preview}\n({ Rt, Nt })`, scope) as {
      Rt(channel: object): void;
      Nt(): void;
    };
    runtime.Rt({ streamUrl: "https://example.com/preview.m3u8" });
    scheduled[0]?.();
    if (useHls) {
      expect(calls.indexOf("source:https://example.com/preview.m3u8")).toBeLessThan(calls.indexOf("attach"));
      events.manifest?.();
      expect(calls).toContain("play");
    } else {
      expect(video.src).toBe("https://example.com/preview.m3u8");
      expect(calls.slice(-2)).toEqual(["load", "play"]);
    }
    runtime.Nt();
    expect(video.src).toBe("");
    expect(calls.slice(-3)).toEqual(["pause", "remove", "load"]);
    expect(calls.includes("destroy")).toBe(useHls);
    expect(window.__tutyPreviewHls).toBeNull();
  });

  it.each([true, false])("delegates relay stream decisions with fallback (core available: %s)", (withCore) => {
    const { runtime, exposedCore } = createRuntime(withCore, false, true);
    expect(runtime.legacyRelayStreamMode("smooth")).toBe(true);
    expect(runtime.legacyRelayStreamMode("normal")).toBe(false);
    expect(runtime.legacyForceRelay("normal", 9)).toBe(true);
    expect(runtime.legacyForceRelay("normal", 0)).toBe(false);
    expect(runtime.legacyRelayResumeStart("http://127.0.0.1:8787/s/a1.mp4?t=1", 4.8)).toEqual({
      url: "http://127.0.0.1:8787/s/a1.mp4?t=1&start=4",
      consumed: true
    });
    expect(runtime.legacyRelayResumeStart("https://example.com/a.mp4", 4)).toEqual({
      url: "https://example.com/a.mp4",
      consumed: false
    });
    expect(exposedCore.isRelayStreamMode).toHaveBeenCalledTimes(withCore ? 2 : 0);
    expect(exposedCore.shouldForceRelay).toHaveBeenCalledTimes(withCore ? 2 : 0);
    expect(exposedCore.applyRelayResumeStart).toHaveBeenCalledTimes(withCore ? 2 : 0);
  });
});
