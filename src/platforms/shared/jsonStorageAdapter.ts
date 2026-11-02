import type { KeyValueStore } from "../../core/contracts/key-value-store";
import type { StorageAdapter } from "../../core/contracts/storage-adapter";
import { readJson, writeJson } from "../../core/usecases/storage/jsonStore";

export interface LegacyCompatibleJsonStorageAdapter extends StorageAdapter {
  getItemOr<T>(key: string, fallback: T): T;
  setItemQuietly(key: string, value: unknown): void;
}

export function createJsonStorageAdapter(store: KeyValueStore): LegacyCompatibleJsonStorageAdapter {
  return {
    getItemOr<T>(key: string, fallback: T): T {
      return readJson(store, key, fallback);
    },
    setItemQuietly(key: string, value: unknown): void {
      writeJson(store, key, value);
    },
    getItem<T>(key: string): T | null {
      const raw = store.getItem(key);
      if (raw === null) {
        return null;
      }

      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    },
    setItem<T>(key: string, value: T): void {
      store.setItem(key, JSON.stringify(value));
    },
    removeItem(key: string): void {
      store.removeItem(key);
    }
  };
}
