import { describe, expect, it, vi } from "vitest";
import { destroyLegacyHls, scheduleGuardedRetry } from "./playbackCoordinator";

describe("playback coordinator", () => {
  it("destroys and clears each HLS slot even when destruction throws", () => {
    const destroy = vi.fn();
    const registry = { __tutyHls: { destroy }, __tutyPreviewHls: { destroy: () => { throw Error("failed"); } } };
    destroyLegacyHls(registry, "__tutyHls");
    expect(destroy).toHaveBeenCalledOnce();
    expect(registry.__tutyHls).toBeNull();
    expect(() => destroyLegacyHls(registry, "__tutyPreviewHls")).not.toThrow();
    expect(registry.__tutyPreviewHls).toBeNull();
  });

  it("checks retry validity when the scheduled callback runs", () => {
    let callback: (() => void) | undefined;
    let current = true;
    const retry = vi.fn();
    const schedule = (next: () => void) => { callback = next; };
    scheduleGuardedRetry(schedule, () => current, retry);
    expect(retry).not.toHaveBeenCalled();
    current = false;
    callback?.();
    expect(retry).not.toHaveBeenCalled();
    current = true;
    callback?.();
    expect(retry).toHaveBeenCalledOnce();
  });
});
