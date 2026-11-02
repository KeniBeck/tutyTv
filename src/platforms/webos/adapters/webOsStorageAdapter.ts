import type { StorageAdapter } from "../../../core/contracts/storage-adapter";
import { createJsonStorageAdapter } from "../../shared/jsonStorageAdapter";

export function createWebOsStorageAdapter(store: Storage = window.localStorage): StorageAdapter {
  return createJsonStorageAdapter(store);
}
