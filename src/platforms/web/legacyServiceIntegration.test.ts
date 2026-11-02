import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");
const helper = source.match(/ {4}function legacyDevServiceUrl\(base, method, parameters\) \{[\s\S]*?(?= {4}function legacyLanguagePreference)/)?.[0];

describe("legacy service requests", () => {
  it.each([true, false])("builds the same dev service URL with fallback (core available: %s)", (withCore) => {
    expect(helper).toBeDefined();
    const exposedCore = { ...core, buildDevServiceUrl: vi.fn(core.buildDevServiceUrl) };
    const runtime = runInNewContext(`${helper}\n({ legacyDevServiceUrl })`, {
      window: { TutyCore: withCore ? exposedCore : undefined }
    }) as {
      legacyDevServiceUrl(base: string, method: string, parameters: Record<string, unknown>): string;
    };

    expect(runtime.legacyDevServiceUrl("http://127.0.0.1:3000/", "home", { root: "tv", page: 2 }))
      .toBe("http://127.0.0.1:3000/home?root=tv&page=2");
    expect(runtime.legacyDevServiceUrl("http://127.0.0.1:3000", "detail", { id: "a b", nil: null }))
      .toBe("http://127.0.0.1:3000/detail?id=a%20b&nil=null");
    expect(runtime.legacyDevServiceUrl("http://127.0.0.1:3000", "ping", {}))
      .toBe("http://127.0.0.1:3000/ping?");
    expect(exposedCore.buildDevServiceUrl).toHaveBeenCalledTimes(withCore ? 3 : 0);
  });
});
