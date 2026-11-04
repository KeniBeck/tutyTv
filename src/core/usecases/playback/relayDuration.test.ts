import { describe, expect, it } from "vitest";
import { relayDurationEndpoint } from "./relayDuration";

describe("relay duration endpoint", () => {
  it("builds the endpoint for relay paths", () => {
    expect(relayDurationEndpoint("http://127.0.0.1:8787/s/abc123.mp4"))
      .toBe("http://127.0.0.1:8787/duration/abc123");
    expect(relayDurationEndpoint("http://127.0.0.1:18810/s/ABC123.mp4?start=10&a=1"))
      .toBe("http://127.0.0.1:18810/duration/ABC123");
  });

  it("returns null for direct or invalid paths", () => {
    expect(relayDurationEndpoint("http://127.0.0.1:3000/media/abc/stream.mp4")).toBeNull();
    expect(relayDurationEndpoint("")).toBeNull();
    expect(relayDurationEndpoint(null as unknown as string)).toBeNull();
  });
});
