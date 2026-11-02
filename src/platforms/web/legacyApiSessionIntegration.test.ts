import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");

const snippet = source.match(
  / {4}function legacyNormalizeApiSession\([\s\S]*?(?= {4}function legacyFormatPlaybackTime\()/
)?.[0];

describe("legacy API session integration", () => {
  it("keeps session, URL and error helpers connected to Core", () => {
    expect(source).toMatch(/_core\.normalizeApiSession\(p\.session\)/);
    expect(source).toMatch(/_core\.hasApiSession\(y\(\)\)/);
    expect(source).toMatch(/_core\.buildServiceParams\(e, t, y\(\)\)/);
    expect(source).toMatch(/_core\.resolveServiceUrl\(p, e\)/);
    expect(source).toMatch(/legacyDescribeServiceError\(t\)/);
  });

  it.each([true, false])("preserves API session behavior (core available: %s)", (withCore) => {
    expect(snippet).toBeTruthy();
    const runtime = runInNewContext(
      `${snippet}\n({ legacyNormalizeApiSession, legacyHasApiSession, legacyBuildServiceParams, legacyResolveServiceUrl, legacyDescribeServiceError })`,
      { window: { TutyCore: withCore ? core : undefined } }
    ) as {
      legacyNormalizeApiSession(session: object | null): {
        userId: string; userToken: string; portalCode: string; homePageCode: string; version: string;
      };
      legacyHasApiSession(session: object | null): boolean;
      legacyBuildServiceParams(kind: string, value: unknown, session: object | null): Record<string, unknown>;
      legacyResolveServiceUrl(config: Record<string, unknown>, method: string): string;
      legacyDescribeServiceError(payload: object | null): string;
    };

    expect(runtime.legacyNormalizeApiSession({ userId: 7, userToken: "token", portalCode: "portal" })).toEqual({
      userId: "7", userToken: "token", portalCode: "portal", homePageCode: "", version: "4.34.4"
    });
    expect(runtime.legacyHasApiSession({ userId: "7", userToken: "token", portalCode: "portal" })).toBe(true);
    expect(runtime.legacyHasApiSession({ userId: "7", userToken: "token" })).toBe(false);
    expect(runtime.legacyBuildServiceParams("search", "cine", {
      userId: "7", userToken: "token", portalCode: "portal"
    })).toEqual({
      userToken: "token", userId: "7", portalCode: "portal", columnId: "",
      value: "cine", type: "", pageSize: 20, pageNum: 1, filter: ""
    });
    expect(runtime.legacyResolveServiceUrl({ catalogUrl: "https://api.test/catalog" }, "catalog")).toBe("https://api.test/catalog");
    expect(runtime.legacyResolveServiceUrl({ baseUrl: "https://api.test/", searchPath: "v1/search" }, "search")).toBe("https://api.test/v1/search");
    expect(runtime.legacyDescribeServiceError({ returnCode: "500", errorMessage: "Fallo" })).toBe("500: Fallo");
    expect(runtime.legacyDescribeServiceError({})).toBe("");
  });
});
