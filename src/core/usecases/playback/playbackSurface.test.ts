import { describe, expect, it } from "vitest";
import {
  applyDetailPlayerTransition,
  applyPlaybackSurface,
  applyPlayerModeClass,
  applyPlayerStatus,
  resetDetailPlayerSurface
} from "./playbackSurface";

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

describe("playback surface", () => {
  it("toggles the video surface and poster visibility", () => {
    const video = fakeElement();
    const poster = fakeElement();

    applyPlaybackSurface(video, poster, true);
    expect(video.classes.has("is-active")).toBe(true);
    expect(poster.style.display).toBe("none");

    applyPlaybackSurface(video, poster, false);
    expect(video.classes.has("is-active")).toBe(false);
    expect(poster.style.display).toBe("block");

    applyPlaybackSurface(null, null, true);
  });

  it("applies detail player and mode transitions", () => {
    const player = fakeElement();
    const detail = fakeElement();
    player.classes.add("is-mini");
    detail.classes.add("is-active");

    applyDetailPlayerTransition(player, detail);
    expect(player.classes.has("is-mini")).toBe(false);
    expect(player.classes.has("is-active")).toBe(true);
    expect(detail.classes.has("is-active")).toBe(false);

    applyPlayerModeClass(player, true);
    expect(player.classes.has("is-vod")).toBe(true);
    applyPlayerModeClass(player, false);
    expect(player.classes.has("is-vod")).toBe(false);

    resetDetailPlayerSurface(player);
    expect(player.classes.has("is-active")).toBe(false);
  });

  it("updates the player status text and active class", () => {
    const status = fakeElement();
    applyPlayerStatus(status, "Cargando vídeo…");
    expect(status.textContent).toBe("Cargando vídeo…");
    expect(status.classes.has("is-active")).toBe(true);

    applyPlayerStatus(status, "");
    expect(status.textContent).toBe("");
    expect(status.classes.has("is-active")).toBe(false);

    applyPlayerStatus(null, "ignorado");
  });
});
