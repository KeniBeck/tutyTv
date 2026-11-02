import { describe, expect, it } from "vitest";
import type { KeyValueStore } from "../../core/contracts/key-value-store";
import { createJsonStorageAdapter } from "./jsonStorageAdapter";

function createMemoryStore(): KeyValueStore {
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

describe("createJsonStorageAdapter", () => {
  it("round-trips JSON values", () => {
    const adapter = createJsonStorageAdapter(createMemoryStore());

    adapter.setItem("profile", { id: "u1", favorites: { "live:a": true } });
    expect(adapter.getItem<{ id: string }>("profile")).toEqual({
      id: "u1",
      favorites: { "live:a": true }
    });

    adapter.removeItem("profile");
    expect(adapter.getItem("profile")).toBeNull();
  });

  it("returns null for missing or invalid JSON values", () => {
    const store = createMemoryStore();
    const adapter = createJsonStorageAdapter(store);

    expect(adapter.getItem("missing")).toBeNull();

    store.setItem("broken", "{not-json");
    expect(adapter.getItem("broken")).toBeNull();
  });
});
