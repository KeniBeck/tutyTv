import type { StorageAdapter } from "../../../core/contracts/storage-adapter";
import { createJsonStorageAdapter } from "../../shared/jsonStorageAdapter";

export function createWebStorageAdapter(store: Storage = window.localStorage): StorageAdapter {
  return createJsonStorageAdapter(store);
}
