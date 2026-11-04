import { describe, expect, it } from "vitest";
import { createAppState } from "../../runtime/state";
import { createPlayerRuntimeHosts } from "./playerRuntimeHosts";

describe("player runtime hosts", () => {
  it("builds every host and derives next episode elements", () => {
    const state = createAppState();
    const prompt = { id: "next-episode-prompt" };
    const hosts = createPlayerRuntimeHosts({
      state,
      byId: (id: string) => (id === "next-episode-prompt" ? prompt : null)
    });
    expect(hosts.playerSession.state).toBe(state);
    expect(hosts.playerResolve.state).toBe(state);
    expect(hosts.playerLive.state).toBe(state);
    expect(hosts.playerRouting.state).toBe(state);
    expect(hosts.playerInfobar.state).toBe(state);
    expect(hosts.liveChannelPanel.state).toBe(state);
    expect(hosts.playerInfoContent.state).toBe(state);
    expect(hosts.nextEpisodeAdvance.state).toBe(state);
    expect(hosts.playerAudio.state).toBe(state);
    expect(hosts.playSettings.state).toBe(state);
    expect(hosts.playerVideoSettings.state).toBe(state);
    expect(hosts.episodeBrowser.state).toBe(state);
    expect(hosts.deepLink.state).toBe(state);
    expect(hosts.nextEpisodePrompt.getPrompt()).toBe(prompt);
    expect(hosts.nextEpisodePrompt.getElements().count).toBeNull();
  });
});
