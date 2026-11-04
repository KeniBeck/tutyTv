import { afterEach, describe, expect, it, vi } from "vitest";
import {
  attachHomeAddons,
  getHomeAddonPresets,
  getHomeAddons,
  resetHomeAddonsRuntime,
  saveHomeAddons
} from "./homeAddons";

function setup(stored: unknown = null) {
  const data = new Map<string, unknown>();
  if (stored !== null) {
    data.set("xuper_m3u_addons", stored);
  }
  const host = {
    readStorage: vi.fn(<T>(_key: string, fallback: T) => (data.get("xuper_m3u_addons") as T) ?? fallback),
    writeStorage: vi.fn((key: string, value: unknown) => { data.set(key, value); })
  };
  attachHomeAddons(host);
  return { host, data };
}

describe("home addons", () => {
  afterEach(() => resetHomeAddonsRuntime());

  it("seeds and stores the first preset when nothing is saved", () => {
    const { host, data } = setup();
    const presets = getHomeAddonPresets();

    expect(getHomeAddons()).toEqual([presets[0]]);
    expect(host.readStorage).toHaveBeenCalledWith("xuper_m3u_addons", null);
    expect(host.writeStorage).toHaveBeenCalledWith("xuper_m3u_addons", [presets[0]]);
    expect(data.get("xuper_m3u_addons")).toEqual([presets[0]]);
    expect(getHomeAddons()).toBe(getHomeAddons());
  });

  it("keeps stored addons without rewriting them", () => {
    const { host } = setup([{ id: "saved", url: "https://saved" }]);

    expect(getHomeAddons()).toEqual([{ id: "saved", url: "https://saved" }]);
    expect(host.writeStorage).not.toHaveBeenCalled();
  });

  it("saves and caches the new addon list", () => {
    const { host, data } = setup();
    getHomeAddons();
    const next = [{ id: "custom", url: "https://custom" }];

    saveHomeAddons(next);
    expect(data.get("xuper_m3u_addons")).toBe(next);
    expect(getHomeAddons()).toBe(next);
    expect(host.writeStorage).toHaveBeenCalledTimes(2);
  });
});
