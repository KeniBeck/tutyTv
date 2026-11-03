import { afterEach, describe, expect, it, vi } from "vitest";
import {
  attachPreview,
  previewChannel,
  resetPreviewRuntime,
  stopPreview,
  type PreviewChannel,
  type PreviewHls,
  type PreviewHost,
  type PreviewResponse,
  type PreviewVideo
} from "./previewPlayer";

interface Harness {
  host: PreviewHost;
  channel: PreviewChannel;
  video: PreviewVideo & {
    pause: ReturnType<typeof vi.fn>;
    removeAttribute: ReturnType<typeof vi.fn>;
  };
  container: {
    classes: Set<string>;
    classList: {
      add(...names: string[]): void;
      remove(...names: string[]): void;
      contains(name: string): boolean;
    };
  };
  status: { textContent: string | null };
  hls: {
    on: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
    callbacks: Record<string, (event?: unknown, data?: { fatal?: boolean }) => void>;
  };
  resolve(error: string | null, response: PreviewResponse | null): void;
}

function createHarness(): Harness {
  const channel: PreviewChannel = { channelCode: "c1", name: "Canal Uno" };
  const classes = new Set<string>();
  const container = {
    classes,
    classList: {
      add(...names: string[]) {
        names.forEach((name) => classes.add(name));
      },
      remove(...names: string[]) {
        names.forEach((name) => classes.delete(name));
      },
      contains(name: string) {
        return classes.has(name);
      }
    }
  };
  const status = { textContent: "" };
  const video = {
    src: "",
    onloadeddata: null,
    onerror: null,
    pause: vi.fn(),
    removeAttribute: vi.fn()
  };
  let resolveLive: (error: string | null | undefined, response: PreviewResponse | null | undefined) => void = () => undefined;
  const callbacks: Record<string, (event?: unknown, data?: { fatal?: boolean }) => void> = {};
  const hls = {
    on: vi.fn((event: string, callback: (event?: unknown, data?: { fatal?: boolean }) => void) => {
      callbacks[event] = callback;
    }),
    destroy: vi.fn(),
    callbacks
  } satisfies PreviewHls & { callbacks: Record<string, (event?: unknown, data?: { fatal?: boolean }) => void> };
  const host: PreviewHost = {
    isHomeLive: () => true,
    getChannel: () => channel,
    getVideo: () => video,
    getContainer: () => container,
    getStatus: () => status,
    resolveLive: vi.fn((_channel, done) => {
      resolveLive = done;
    }),
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    setSource: vi.fn(),
    load: vi.fn(),
    loadHls: vi.fn(),
    destroyHls: vi.fn(),
    setHls: vi.fn(),
    createHls: vi.fn(() => hls),
    hlsEvents: () => ({ MANIFEST_PARSED: "manifest", ERROR: "error" }),
    canUseHls: () => true,
    nativeTvPlayback: () => false,
    nativePreviewHls: () => false
  };
  return {
    host,
    channel,
    video,
    container,
    status,
    hls,
    resolve(error, response) {
      resolveLive(error, response);
    }
  };
}

afterEach(() => {
  resetPreviewRuntime();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("previewPlayer", () => {
  it("debounces channel changes before resolving the live signal", () => {
    vi.useFakeTimers();
    const harness = createHarness();
    attachPreview(harness.host);

    previewChannel(harness.channel);
    expect(harness.host.resolveLive).not.toHaveBeenCalled();
    vi.advanceTimersByTime(219);
    expect(harness.host.resolveLive).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(harness.host.resolveLive).toHaveBeenCalledWith(harness.channel, expect.any(Function));
  });

  it("loads a direct source and marks the preview as playing", () => {
    vi.useFakeTimers();
    const harness = createHarness();
    attachPreview(harness.host);

    previewChannel(harness.channel);
    vi.advanceTimersByTime(220);
    expect(harness.container.classes.has("is-preview-loading")).toBe(true);
    expect(harness.status.textContent).toContain("Canal Uno");

    harness.resolve(null, { returnValue: true, url: "http://example.com/live.mp4" });
    expect(harness.host.setSource).toHaveBeenCalledWith(harness.video, "http://example.com/live.mp4");
    expect(harness.host.load).toHaveBeenCalledWith(harness.video);
    expect(harness.host.play).toHaveBeenCalledWith(harness.video);

    harness.video.onloadeddata?.();
    expect(harness.container.classes.has("is-preview-loading")).toBe(false);
    expect(harness.container.classes.has("is-preview-playing")).toBe(true);
    expect(harness.status.textContent).toBe("");
  });

  it("creates an HLS preview when the resolved signal is m3u8", () => {
    vi.useFakeTimers();
    const harness = createHarness();
    attachPreview(harness.host);

    previewChannel(harness.channel);
    vi.advanceTimersByTime(220);
    harness.resolve(null, { returnValue: true, url: "http://example.com/live.m3u8" });

    expect(harness.host.createHls).toHaveBeenCalledTimes(1);
    expect(harness.host.setHls).toHaveBeenCalledWith(harness.hls);
    expect(harness.host.loadHls).toHaveBeenCalledWith(
      harness.video,
      harness.hls,
      "http://example.com/live.m3u8"
    );
    expect(harness.host.play).not.toHaveBeenCalled();

    harness.hls.callbacks.manifest?.();
    expect(harness.host.play).toHaveBeenCalledWith(harness.video);
  });

  it("ignores stale resolutions and clears playback on stop", () => {
    vi.useFakeTimers();
    const harness = createHarness();
    attachPreview(harness.host);

    previewChannel(harness.channel);
    vi.advanceTimersByTime(220);
    const stale = harness.resolve;
    expect(stopPreview()).toBe(true);
    expect(harness.container.classes.size).toBe(0);
    expect(harness.status.textContent).toBe("");
    expect(harness.host.pause).toHaveBeenCalledWith(harness.video);
    expect(harness.host.destroyHls).toHaveBeenCalled();

    stale(null, { returnValue: true, url: "http://example.com/stale.mp4" });
    expect(harness.host.setSource).not.toHaveBeenCalledWith(harness.video, "http://example.com/stale.mp4");
    expect(harness.host.play).not.toHaveBeenCalled();
  });

  it("does not resolve outside the live Home tab", () => {
    vi.useFakeTimers();
    const harness = createHarness();
    harness.host.isHomeLive = () => false;
    attachPreview(harness.host);

    previewChannel(harness.channel);
    vi.advanceTimersByTime(220);
    expect(harness.host.resolveLive).not.toHaveBeenCalled();
  });
});
