import { describe, expect, it, vi } from "vitest";
import {
  createHtml5PlayerAdapter,
  type HlsLoaderLike,
  type VideoElementLike
} from "./html5PlayerAdapter";

function createVideo(): VideoElementLike & {
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  load: ReturnType<typeof vi.fn>;
} {
  return {
    src: "",
    currentTime: 0,
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    load: vi.fn()
  };
}

function createHls(): HlsLoaderLike & {
  attachMedia: ReturnType<typeof vi.fn>;
  loadSource: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
} {
  return {
    attachMedia: vi.fn(),
    loadSource: vi.fn(),
    destroy: vi.fn()
  };
}

describe("createHtml5PlayerAdapter", () => {
  it("uses native HLS when the platform supports it", async () => {
    const video = createVideo();
    const adapter = createHtml5PlayerAdapter({ video, canPlayNativeHls: () => true });

    await adapter.load({ url: "http://example.com/live.m3u8", isHls: true });

    expect(video.src).toBe("http://example.com/live.m3u8");
    expect(video.load).toHaveBeenCalledTimes(1);
  });

  it("delegates HLS to the injected loader", async () => {
    const video = createVideo();
    const hls = createHls();
    const loadHls = vi.fn(() => hls);
    const adapter = createHtml5PlayerAdapter({
      video,
      createHls: loadHls,
      canPlayNativeHls: () => false
    });

    await adapter.load({ url: "http://example.com/vod.m3u8", isHls: true });

    expect(loadHls).toHaveBeenCalledTimes(1);
    expect(hls.attachMedia).toHaveBeenCalledWith(video);
    expect(hls.loadSource).toHaveBeenCalledWith("http://example.com/vod.m3u8");
  });

  it("plays, pauses, seeks and stops", async () => {
    const video = createVideo();
    const hls = createHls();
    const adapter = createHtml5PlayerAdapter({
      video,
      createHls: () => hls,
      canPlayNativeHls: () => false
    });

    await adapter.load({ url: "http://example.com/vod.m3u8", isHls: true });
    await adapter.play();
    adapter.pause();
    adapter.seekTo(42);
    adapter.stop();

    expect(video.play).toHaveBeenCalledTimes(1);
    expect(video.pause).toHaveBeenCalledTimes(2);
    expect(video.currentTime).toBe(0);
    expect(hls.destroy).toHaveBeenCalledTimes(1);
    expect(video.src).toBe("");
  });

  it("preserves synchronous playback results and external HLS ordering", () => {
    const video = createVideo();
    const adapter = createHtml5PlayerAdapter({ video });
    const promise = Promise.resolve();
    video.play.mockReturnValueOnce(promise);
    expect(adapter.playImmediate()).toBe(promise);
    video.play.mockImplementationOnce(() => { throw new Error("blocked"); });
    expect(() => adapter.playImmediate()).toThrow("blocked");

    const calls: string[] = [];
    const hls: HlsLoaderLike = {
      loadSource: (url) => calls.push(`source:${url}`),
      attachMedia: (element) => calls.push(element === video ? "attach" : "wrong video")
    };
    adapter.loadExternalHls(hls, "stream.m3u8");
    expect(calls).toEqual(["source:stream.m3u8", "attach"]);
    adapter.setSource("video.mp4");
    adapter.reload();
    expect(video.src).toBe("video.mp4");
    expect(video.load).toHaveBeenCalledOnce();
  });
});
