import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { storage } from "../shared/legacyCoreBridge";

const appSource = readFileSync(new URL(
  "../../ui/legacy/legacyActions.js",
  import.meta.url
), "utf8");
const helpers = appSource.match(/ {4}function G\(e, t\) \{[\s\S]*?(?= {4}function legacyCanUseLuna)/)?.[0];

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    clear() { data.clear(); },
    getItem(key) { return data.get(key) ?? null; },
    key(index) { return Array.from(data.keys())[index] ?? null; },
    removeItem(key) { data.delete(key); },
    setItem(key, value) { data.set(key, String(value)); }
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("legacy storage integration", () => {
  it.each([true, false])("preserves G/J profile persistence (core available: %s)", (withCore) => {
    expect(helpers).toBeDefined();
    const localStorage = memoryStorage();
    const window = { localStorage, TutyCore: withCore ? { storage } : undefined };
    vi.stubGlobal("window", window);
    const readSpy = vi.spyOn(storage, "read");
    const writeSpy = vi.spyOn(storage, "write");
    const legacy = runInNewContext(`${helpers}\n({ G, J })`, { window, localStorage }) as {
      G(key: string, fallback: unknown): unknown;
      J(key: string, value: unknown): void;
    };

    const profile = { favs: { movie: true }, history: [{ id: "episode-1" }] };
    legacy.J("xuper_local_profile_v1", profile);
    expect(localStorage.getItem("xuper_local_profile_v1")).toBe(JSON.stringify(profile));
    expect(JSON.stringify(legacy.G("xuper_local_profile_v1", {}))).toBe(JSON.stringify(profile));
    expect(legacy.G("missing", "fallback")).toBe("fallback");
    localStorage.setItem("invalid", "{");
    expect(legacy.G("invalid", "fallback")).toBe("fallback");
    localStorage.setItem("null", "null");
    expect(legacy.G("null", "fallback")).toBeNull();
    legacy.J("undefined", undefined);
    expect(localStorage.getItem("undefined")).toBe("undefined");
    expect(readSpy).toHaveBeenCalledTimes(withCore ? 4 : 0);
    expect(writeSpy).toHaveBeenCalledTimes(withCore ? 2 : 0);
  });


  it("handles an unavailable localStorage getter", () => {
    vi.stubGlobal("window", Object.defineProperty({}, "localStorage", {
      get() { throw new Error("denied"); }
    }));
    expect(storage.read("profile", "fallback")).toBe("fallback");
    expect(() => storage.write("profile", {})).not.toThrow();
  });
});
