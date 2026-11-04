import { describe, expect, it } from "vitest";
import type { KeyValueStore } from "../../contracts/key-value-store";
import { readJson, writeJson } from "./jsonStore";

function createStore(): KeyValueStore {
  const data = new Map<string, string>();

  return {
    getItem(key: string): string | null {
      return data.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      data.set(key, value);
    },
    removeItem(key: string): void {
      data.delete(key);
    }
  };
}

describe("readJson", () => {
  it("reads JSON and falls back for missing or invalid values", () => {
    const store = createStore();
    expect(readJson(store, "missing", { ok: false })).toEqual({ ok: false });

    store.setItem("broken", "{not-json");
    expect(readJson(store, "broken", "fallback")).toBe("fallback");

    store.setItem("empty", "");
    expect(readJson(store, "empty", "fallback")).toBe("fallback");
  });

  it("preserves explicit JSON null instead of using the fallback", () => {
    const store = createStore();
    store.setItem("null", "null");

    expect(readJson(store, "null", { ok: false })).toBeNull();
  });

  it("falls back when reads fail", () => {
    const store = createStore();
    store.getItem = () => { throw new Error("denied"); };
    expect(readJson(store, "profile", "fallback")).toBe("fallback");
  });
});

describe("writeJson", () => {
  it("serializes values and ignores storage errors", () => {
    const store = createStore();
    writeJson(store, "profile", { id: "u1", favorites: { "live:a": true } });

    expect(readJson(store, "profile", null)).toEqual({
      id: "u1",
      favorites: { "live:a": true }
    });

    const broken: KeyValueStore = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {}
    };

    expect(() => writeJson(broken, "profile", { id: "u1" })).not.toThrow();
    const circular: { self?: unknown } = {};
    circular.self = circular;
    expect(() => writeJson(store, "profile", circular)).not.toThrow();
  });

  it("keeps the legacy representation for undefined values", () => {
    const store = createStore();
    writeJson(store, "undefined", undefined);

    expect(store.getItem("undefined")).toBe("undefined");
  });
});
