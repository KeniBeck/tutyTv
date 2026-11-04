import { describe, expect, it } from "vitest";
import { createAppState } from "../runtime/state";
import { createLegacyWiring } from "./legacyWiring.js";

describe("legacy wiring", () => {
  it("reads mutable state dynamically from the context", () => {
    const state = createAppState();
    let channels: Array<{ name: string }> = [];
    const ctx = new Proxy(
      {
        j: state,
        get F() {
          return channels;
        }
      },
      {
        get(target: Record<string, unknown>, key: string) {
          return key in target ? target[key] : undefined;
        }
      }
    );
    const { getUiRuntimeDeps } = createLegacyWiring(ctx as never);
    const deps = getUiRuntimeDeps() as { getChannels(): unknown };
    channels = [{ name: "Uno" }];
    expect(deps.getChannels()).toBe(channels);
  });
});
