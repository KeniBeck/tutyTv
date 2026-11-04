import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL(
  "../../../src/ui/runtime/catalogRuntime.ts",
  import.meta.url
), "utf8");


describe("legacy API session integration", () => {
  it("keeps session, URL and error helpers connected to Core", () => {
    expect(source).toMatch(/normalizeApiSession\(/);
    expect(source).toMatch(/hasApiSession\(/);
    expect(source).toMatch(/buildServiceParams\(/);
    expect(source).toMatch(/resolveServiceUrl\(/);
    expect(source).toMatch(/describeServiceError\(/);
  });

});
