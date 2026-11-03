import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");


describe("legacy API session integration", () => {
  it("keeps session, URL and error helpers connected to Core", () => {
    expect(source).toMatch(/_core\.normalizeApiSession\(p\.session\)/);
    expect(source).toMatch(/_core\.hasApiSession\(y\(\)\)/);
    expect(source).toMatch(/_core\.buildServiceParams\(e, t, y\(\)\)/);
    expect(source).toMatch(/_core\.resolveServiceUrl\(p, e\)/);
    expect(source).toMatch(/legacyDescribeServiceError\(t\)/);
  });

});
