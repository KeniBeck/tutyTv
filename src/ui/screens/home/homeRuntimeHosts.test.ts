import { describe, expect, it } from "vitest";
import { createAppState } from "../../runtime/state";
import { createHomeRuntimeHosts, type HomeRuntimeDeps } from "./homeRuntimeHosts";

describe("home runtime hosts", () => {
  it("builds every host from shared dependencies", () => {
    const state = createAppState();
    const channels = [{ channelCode: "1" }];
    const rows = [{ _channel: 0 }];
    const hosts = createHomeRuntimeHosts({
      state,
      getChannels: () => channels,
      getShellChannels: () => rows
    } as HomeRuntimeDeps);
    expect(hosts.homeShell.getChannels()).toBe(rows);
    expect(hosts.liveLoader.getChannels()).toBe(channels);
    expect(hosts.homeTabs.state).toBe(state);
    expect(hosts.homeShell.state).toBe(state);
    expect(hosts.liveFavorites.state).toBe(state);
    expect(hosts.playerLiveCategories.state).toBe(state);
    expect(hosts.liveLoader.state).toBe(state);
    expect(hosts.screenFocus.state).toBe(state);
    expect(hosts.homeTabs.buildShell()).toBeNull();
  });
});
