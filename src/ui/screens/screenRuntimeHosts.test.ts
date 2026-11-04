import { describe, expect, it } from "vitest";
import { createAppState } from "../runtime/state";
import { createScreenRuntimeHosts, type ScreenRuntimeDeps } from "./screenRuntimeHosts";

describe("screen runtime hosts", () => {
  it("derives app root and notify nodes from byId", () => {
    const state = createAppState();
    const app = { id: "app" };
    const notify = { id: "home-notify" };
    const deps = {
      state,
      byId: (id: string) => (id === "app" ? app : id === "home-notify" ? notify : null)
    } as unknown as ScreenRuntimeDeps;
    const hosts = createScreenRuntimeHosts(deps);
    expect(hosts.search.state).toBe(state);
    expect(hosts.search.getAppRoot()).toBe(app);
    expect(hosts.search.getNotify()).toBe(notify);
    expect(hosts.settings.state).toBe(state);
    expect(hosts.detail.state).toBe(state);
    expect(hosts.resume.state).toBe(state);
    expect(hosts.resume.getAppRoot()).toBe(app);
  });
});
