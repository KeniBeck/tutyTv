import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");
const save = source.match(/ {4}function Ta\(e, t, i\) \{[\s\S]*?(?= {4}function qa\(e\) \{)/)?.[0];
const shouldPersist = source.match(/ {4}function legacyShouldPersistPlaybackHistory\([\s\S]*?(?= {4}function legacyResolvePlaybackTotalWithRelay)/)?.[0];

describe("legacy playback history", () => {
  it.each([true, false])("preserves history data, deduplication, limit and throttling (core available: %s)", (withCore) => {
    expect(save && shouldPersist).toBeDefined();
    let now = 100_000;
    const writes = vi.fn();
    const item = { id: 7, title: "Series", poster: "poster.jpg", duration: 90 };
    const j = {
      noHistorySave: false, playerItem: item,
      playerEpisode: { id: 21, number: 4 }
    };
    const history = [{ id: "7", position: 9 }, ...Array.from({ length: 35 }, (_, i) => ({ id: `old-${i}` }))];
    const profile = { history };
    const exposedCore = { ...core, updatePlaybackHistory: vi.fn(core.updatePlaybackHistory) };
    const scope = {
      window: { TutyCore: withCore ? exposedCore : undefined },
      j, X: profile, W: "xuper_local_profile_v1", La: 0,
      Date: { now: () => now }, J: writes, S: () => true
    };
    const runtime = runInNewContext(`${shouldPersist}\n${save}\n({ Ta })`, scope) as { Ta(position: number, duration: number, force: boolean): void };
    runtime.Ta(2, 100, false);
    expect(writes).not.toHaveBeenCalled();
    runtime.Ta(10.9, 0, false);
    expect(writes).toHaveBeenCalledOnce();
    expect(writes.mock.calls[0]?.[0]).toBe("xuper_local_profile_v1");
    expect(JSON.parse(JSON.stringify(profile.history[0]))).toEqual({
      id: "7", title: "Series", poster: "poster.jpg", series: true,
      seriesId: "7", seasonId: "7", episodeId: "21", episodeNumber: 4,
      episodeTitle: "", position: 10, duration: 90, updatedAt: 100_000
    });
    expect(profile.history).toHaveLength(30);
    expect(profile.history.filter((entry) => entry.id === "7")).toHaveLength(1);
    now += 1000;
    runtime.Ta(20, 100, false);
    expect(writes).toHaveBeenCalledOnce();
    runtime.Ta(20, 100, true);
    expect(writes).toHaveBeenCalledTimes(2);
    expect(profile.history[0]).toMatchObject({ id: "7", position: 20, duration: 100, updatedAt: now });
    j.noHistorySave = true;
    runtime.Ta(30, 100, true);
    expect(writes).toHaveBeenCalledTimes(2);
    j.noHistorySave = false;
    now += 15_000;
    runtime.Ta(3, 100, false);
    expect(writes).toHaveBeenCalledTimes(3);
    item.id = 0;
    runtime.Ta(50, 100, true);
    expect(writes).toHaveBeenCalledTimes(3);
    expect(exposedCore.updatePlaybackHistory).toHaveBeenCalledTimes(withCore ? 3 : 0);
  });
});
