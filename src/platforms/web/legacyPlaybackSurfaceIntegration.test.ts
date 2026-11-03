import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");

const snippet = source.match(
  / {4}function legacyApplyPlaybackSurface\(video, poster, active\) \{[\s\S]*?(?= {4}function legacyDevServiceUrl)/
)?.[0];

function fakeElement() {
  const classes = new Set<string>();
  return {
    classes,
    classList: {
      add(token: string) {
        classes.add(token);
      },
      remove(token: string) {
        classes.delete(token);
      }
    },
    style: { display: "block" },
    textContent: "texto"
  };
}

describe("legacy playback surface integration", () => {
  it("keeps the player surface and status connected to Core", () => {
    expect(source).toMatch(/legacyApplyPlaybackSurface\(we, xe, !1\)/);
    expect(source).toMatch(/legacyApplyPlaybackSurface\(we, xe, !0\)/);
    expect(source).toMatch(/legacyApplyPlayerStatus\(Se, e\)/);
    expect(source).toMatch(/legacyApplyDetailPlayerTransition\(playerScreen, detailScreen\)/);
    expect(source).toMatch(/legacyResetDetailPlayerSurface\(r\)/);
    expect(source).toMatch(/legacyApplyPlayerModeClass\(ye, !0\)/);
  });

  it.each([true, false])("applies playback surfaces and status (core available: %s)", (withCore) => {
    expect(snippet).toBeTruthy();
    const runtime = runInNewContext(
      `${snippet}\n({ legacyApplyPlaybackSurface, legacyApplyPlayerStatus, `
      + "legacyApplyDetailPlayerTransition, legacyResetDetailPlayerSurface, legacyApplyPlayerModeClass })",
      { window: { TutyCore: withCore ? core : undefined } }
    ) as {
      legacyApplyPlaybackSurface(video: unknown, poster: unknown, active: boolean): void;
      legacyApplyPlayerStatus(element: unknown, message: unknown): void;
      legacyApplyDetailPlayerTransition(player: unknown, detail: unknown): void;
      legacyResetDetailPlayerSurface(player: unknown): void;
      legacyApplyPlayerModeClass(element: unknown, isVod: boolean): void;
    };

    const video = fakeElement();
    const poster = fakeElement();
    runtime.legacyApplyPlaybackSurface(video, poster, true);
    expect(video.classes.has("is-active")).toBe(true);
    expect(poster.style.display).toBe("none");

    runtime.legacyApplyPlaybackSurface(video, poster, false);
    expect(video.classes.has("is-active")).toBe(false);
    expect(poster.style.display).toBe("block");

    const status = fakeElement();
    runtime.legacyApplyPlayerStatus(status, "Cargando vídeo…");
    expect(status.textContent).toBe("Cargando vídeo…");
    expect(status.classes.has("is-active")).toBe(true);

    runtime.legacyApplyPlayerStatus(status, "");
    expect(status.textContent).toBe("");
    expect(status.classes.has("is-active")).toBe(false);

    const player = fakeElement();
    const detail = fakeElement();
    player.classes.add("is-mini");
    detail.classes.add("is-active");
    runtime.legacyApplyDetailPlayerTransition(player, detail);
    expect(player.classes.has("is-mini")).toBe(false);
    expect(player.classes.has("is-active")).toBe(true);
    expect(detail.classes.has("is-active")).toBe(false);

    runtime.legacyApplyPlayerModeClass(player, true);
    expect(player.classes.has("is-vod")).toBe(true);
    runtime.legacyApplyPlayerModeClass(player, false);
    expect(player.classes.has("is-vod")).toBe(false);

    runtime.legacyResetDetailPlayerSurface(player);
    expect(player.classes.has("is-active")).toBe(false);
  });
});
