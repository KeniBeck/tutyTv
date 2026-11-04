import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync(new URL(
  "../../ui/legacy/legacyActions.js",
  import.meta.url
), "utf8");

const itemKey = source.match(/ {4}function ja\(e\) \{[\s\S]*?(?= {4}function Wa)/)?.[0];
const readMode = source.match(/ {4}function Wa\(e\) \{[\s\S]*?(?= {4}function \$a)/)?.[0];
const writeMode = source.match(/ {4}function \$a\(e, t\) \{[\s\S]*?(?= {4}function Xa)/)?.[0];

function createRuntime(savedStreamModes: Record<string, boolean>) {
  const playback = {
    streamMode: "normal",
    streamModes: savedStreamModes
  };
  const j = {
    streamMode: "normal",
    playback
  };
  const Q = vi.fn();
  const context = {
    ctx: {
      j,
      za: playback.streamModes,
      profileRuntime: { savePlayback: Q }
    }
  };
  const runtime = runInNewContext(
    `${itemKey}\n${readMode}\n${writeMode}\nfunction Q(){ ctx.profileRuntime.savePlayback(); }\n({ Wa, $a })`,
    context
  ) as {
    Wa(item: unknown): void;
    $a(item: unknown, smooth: boolean): void;
  };
  return { runtime, j, playback, Q, context };
}

describe("legacy stream mode preferences", () => {
  it("restores the per-title mode from persisted playback preferences", () => {
    expect(itemKey && readMode && writeMode).toBeTruthy();
    const { runtime, j } = createRuntime({ title1: true });

    runtime.Wa({ id: "title1" });
    expect(j.streamMode).toBe("smooth");

    runtime.Wa({ id: "title2" });
    expect(j.streamMode).toBe("normal");
  });

  it("stores per-title changes in playback preferences and saves them", () => {
    const { runtime, j, playback, Q } = createRuntime({});

    runtime.$a({ id: "title1" }, true);

    expect(j.streamMode).toBe("smooth");
    expect(playback.streamModes.title1).toBe(true);
    expect(Q).toHaveBeenCalledTimes(1);
  });

  it("keeps the saved mode when a new runtime reads it back", () => {
    const first = createRuntime({});
    first.runtime.$a({ id: "series-9" }, true);
    const saved = first.playback.streamModes;

    const reloaded = createRuntime(saved);
    reloaded.runtime.Wa({ id: "series-9" });

    expect(reloaded.j.streamMode).toBe("smooth");
  });

  it("persists an explicit normal mode instead of dropping the preference", () => {
    const { runtime, j, playback, Q } = createRuntime({ title1: true });

    runtime.$a({ id: "title1" }, false);

    expect(j.streamMode).toBe("normal");
    expect(playback.streamModes.title1).toBe(false);
    expect(Q).toHaveBeenCalledTimes(1);
  });
});
