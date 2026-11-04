import { describe, expect, it } from "vitest";
import { selectNativeRetry } from "./nativeRetry";

describe("selectNativeRetry", () => {
  it("retries unsupported live HLS only before forcing native HLS", () => {
    expect(selectNativeRetry(4, "live", "normal", true, false, false)).toBe("native-hls");
    expect(selectNativeRetry(4, "live", "normal", true, true, false)).toBeNull();
    expect(selectNativeRetry(4, "live", "normal", false, false, false)).toBeNull();
    expect(selectNativeRetry(3, "live", "normal", true, false, false)).toBeNull();
  });

  it("retries VOD only with an item and normal playback", () => {
    expect(selectNativeRetry(4, "vod", "normal", false, false, true)).toBe("compatible-vod");
    expect(selectNativeRetry(4, "vod", "smooth", true, false, true)).toBeNull();
    expect(selectNativeRetry(4, "vod", "normal", true, false, false)).toBeNull();
    expect(selectNativeRetry(null, "vod", "normal", true, false, true)).toBeNull();
  });
});
