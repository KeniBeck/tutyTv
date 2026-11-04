import { describe, expect, it } from "vitest";
import { createHistoryRuntime, type HistoryRuntimeDeps } from "./historyRuntime";
import { createAppState } from "./state";

function harness(overrides: Partial<HistoryRuntimeDeps> = {}) {
  const catalog: Array<Record<string, unknown>> = [];
  const opened: Array<Record<string, unknown>> = [];
  const deps: HistoryRuntimeDeps = {
    state: createAppState(),
    getCatalog: () => catalog as never,
    getProfile: () => ({ history: [] }),
    saveProfile: () => {},
    requestSearch: (_params, done) => {
      done(null, {});
      return true;
    },
    buildSearchParams: () => ({}),
    extract: () => [],
    normalize: (item) => item as never,
    isSeries: () => false,
    openDetail: (item) => opened.push(item),
    loadSeasonEpisodes: () => {},
    renderDetail: () => {},
    resolveEpisode: () => null,
    log: () => {},
    ...overrides
  };
  return { catalog, opened, deps };
}

describe("history runtime", () => {
  it("opens a catalog item by id and forces portal detail", () => {
    const test = harness();
    const item: Record<string, unknown> = { id: "movie", title: "Película", _detailsLoaded: false };
    test.catalog.push(item);
    createHistoryRuntime(test.deps).open({ id: "movie", title: "Película" });
    expect(item._portal).toBe(true);
    expect(test.opened[0]).toBe(item);
  });

  it("matches a normalized title when the id changed", () => {
    const test = harness();
    const item: Record<string, unknown> = { id: "new-id", title: "Película Vieja", _detailsLoaded: false };
    test.catalog.push(item);
    createHistoryRuntime(test.deps).open({ id: "old-id", title: "Película Vieja" });
    expect(item._portal).toBe(true);
    expect(test.opened[0]).toBe(item);
  });

  it("uses search when the title is not loaded", () => {
    const found = { id: "new-id", title: "Título Viejo" };
    const test = harness({
      extract: () => [found] as never,
      requestSearch: (_params, done) => {
        done(null, {});
        return true;
      }
    });
    createHistoryRuntime(test.deps).open({ id: "old-id", title: "Título Viejo" });
    expect(found).toMatchObject({ _portal: true });
    expect(test.opened[0]).toBe(found);
  });

  it("falls back to the normalized history item", () => {
    const normalized = { id: "external", title: "Externo" };
    const test = harness({
      normalize: () => normalized as never,
      requestSearch: (_params, done) => {
        done("no service", null);
        return false;
      }
    });
    createHistoryRuntime(test.deps).open({ id: "external", title: "Externo" });
    expect(normalized).toMatchObject({ _portal: true });
    expect(test.opened[0]).toBe(normalized);
  });
});
