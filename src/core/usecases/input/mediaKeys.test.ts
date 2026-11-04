import { describe, expect, it } from "vitest";
import { mapLegacyMediaKey } from "./mediaKeys";

describe("legacy media keys", () => {
  it("maps numeric remote codes", () => {
    expect(mapLegacyMediaKey(415, "")).toBe("play");
    expect(mapLegacyMediaKey(19, "")).toBe("pause");
    expect(mapLegacyMediaKey(10252, "")).toBe("playpause");
    expect(mapLegacyMediaKey(417, "")).toBe("forward");
    expect(mapLegacyMediaKey(412, "")).toBe("rewind");
    expect(mapLegacyMediaKey(413, "")).toBe("stop");
    expect(mapLegacyMediaKey(457, "")).toBe("menu");
    expect(mapLegacyMediaKey(93, "")).toBe("menu");
    expect(mapLegacyMediaKey(467, "")).toBe("menu");
    expect(mapLegacyMediaKey(38, "ArrowUp")).toBeNull();
    expect(mapLegacyMediaKey(undefined, undefined)).toBeNull();
  });

  it("maps keyboard media names", () => {
    expect(mapLegacyMediaKey(0, "MediaPlay")).toBe("play");
    expect(mapLegacyMediaKey(0, "Pause")).toBe("pause");
    expect(mapLegacyMediaKey(0, "MediaPlayPause")).toBe("playpause");
    expect(mapLegacyMediaKey(0, "FastForward")).toBe("forward");
    expect(mapLegacyMediaKey(0, "Rewind")).toBe("rewind");
    expect(mapLegacyMediaKey(0, "Stop")).toBe("stop");
    expect(mapLegacyMediaKey(0, "ContextMenu")).toBe("menu");
    expect(mapLegacyMediaKey(0, "Enter")).toBeNull();
  });
});
