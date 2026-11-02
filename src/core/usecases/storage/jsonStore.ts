import type { KeyValueStore } from "../../contracts/key-value-store";

export function readJson<T>(store: KeyValueStore, key: string, fallback: T): T {
  try {
    const raw = store.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(store: KeyValueStore, key: string, value: unknown): void {
  try {
    const encoded = JSON.stringify(value);
    store.setItem(key, encoded === undefined ? "undefined" : encoded);
  } catch {
    // Paridad con J(): los fallos de almacenamiento se ignoran.
  }
}
