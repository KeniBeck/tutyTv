import { afterEach, describe, expect, it, vi } from "vitest";
import { createCatalogRuntime, type CatalogItem, type CatalogRuntimeDeps } from "./catalogRuntime";
import { createAppState } from "./state";

function harness(overrides: Partial<CatalogRuntimeDeps> = {}) {
  const state = createAppState();
  const catalog: CatalogItem[] = [];
  const status = { loading: false, source: "demo", error: null as string | null };
  const portal = { refreshing: false, lastSync: 0, roots: 0, error: null as string | null };
  const calls: string[] = [];
  const deps: CatalogRuntimeDeps = {
    state,
    getConfig: () => ({ enabled: true, mode: "api", baseUrl: "https://api.test", detailPath: "/detail" }),
    getCatalog: () => catalog,
    getStatus: () => status,
    getPortalState: () => portal,
    getRoots: () => ["featured"],
    request: () => true,
    requestDev: (_url, done) => {
      done(null, { items: [{ id: "1", title: "Remoto" }] });
      return true;
    },
    afterCatalogApplied: () => calls.push("catalog"),
    checkReminders: () => calls.push("reminders"),
    syncMediaInfo: () => calls.push("sync"),
    afterDetailLoaded: () => calls.push("detail"),
    ...overrides
  };
  return { state, catalog, status, portal, calls, deps };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("catalog runtime", () => {
  it("applies catalog preserving episodes and reporting source", () => {
    vi.useFakeTimers();
    const test = harness();
    test.catalog.push({ id: "1", episodes: [{ id: "e1" }], streamUrl: "old" });
    const runtime = createCatalogRuntime(test.deps);
    expect(runtime.applyCatalog([{ id: "1", title: "Nuevo" }], "api")).toBe(true);
    expect(test.catalog[0]?.title).toBe("Nuevo");
    expect(test.catalog[0]?.episodes).toEqual([{ id: "e1" }]);
    expect(test.catalog[0]?.streamUrl).toBe("old");
    expect(test.status.source).toBe("api");
    expect(test.calls).toContain("catalog");
    vi.advanceTimersByTime(1500);
    expect(test.calls).toContain("reminders");
  });

  it("loads detail through the API and notifies after merge", () => {
    const test = harness();
    const runtime = createCatalogRuntime(test.deps);
    const item: CatalogItem = { id: "1", title: "Viejo" };
    runtime.loadDetail(item);
    expect(item.title).toBe("Remoto");
    expect(item._detailsLoaded).toBe(true);
    expect(test.calls).toContain("detail");
  });
});
