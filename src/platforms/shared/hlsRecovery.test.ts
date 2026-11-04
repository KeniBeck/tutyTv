import { describe, expect, it, vi } from "vitest";
import { handleHlsError } from "./hlsRecovery";

describe("handleHlsError", () => {
  it("recovers network and media errors and reports other fatal errors", () => {
    const hls = { startLoad: vi.fn(), recoverMediaError: vi.fn() };
    const getTypes = vi.fn(() => ({ NETWORK_ERROR: "network", MEDIA_ERROR: "media" }));
    const fatal = vi.fn();
    handleHlsError(hls, null, getTypes, fatal);
    handleHlsError(hls, { fatal: false, type: "network" }, getTypes, fatal);
    expect(getTypes).not.toHaveBeenCalled();
    handleHlsError(hls, { fatal: true, type: "network" }, getTypes, fatal);
    handleHlsError(hls, { fatal: true, type: "media" }, getTypes, fatal);
    handleHlsError(hls, { fatal: true, type: "other" }, getTypes, fatal);
    expect(hls.startLoad).toHaveBeenCalledOnce();
    expect(hls.recoverMediaError).toHaveBeenCalledOnce();
    expect(fatal).toHaveBeenCalledOnce();
  });

  it("ignores recovery exceptions but propagates fatal reporting errors", () => {
    const hls = {
      startLoad: () => { throw new Error("network recovery failed"); },
      recoverMediaError: () => { throw new Error("media recovery failed"); }
    };
    const getTypes = () => ({ NETWORK_ERROR: "network", MEDIA_ERROR: "media" });
    const fatal = () => { throw new Error("report failed"); };
    expect(() => handleHlsError(hls, { fatal: true, type: "network" }, getTypes, fatal)).not.toThrow();
    expect(() => handleHlsError(hls, { fatal: true, type: "media" }, getTypes, fatal)).not.toThrow();
    expect(() => handleHlsError(hls, { fatal: true, type: "other" }, getTypes, fatal)).toThrow("report failed");
  });
});
