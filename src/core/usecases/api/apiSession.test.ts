import { describe, expect, it } from "vitest";
import {
  buildServiceParams,
  describeServiceError,
  hasApiSession,
  normalizeApiSession,
  resolveServiceUrl
} from "./apiSession";

describe("API session", () => {
  it("normalizes strings and the default version", () => {
    expect(normalizeApiSession({ userId: 7, userToken: "token", portalCode: "portal" })).toEqual({
      userId: "7",
      userToken: "token",
      portalCode: "portal",
      homePageCode: "",
      version: "4.34.4"
    });
  });

  it("requires userId, userToken and portalCode", () => {
    expect(hasApiSession({ userId: "7", userToken: "token", portalCode: "portal" })).toBe(true);
    expect(hasApiSession({ userId: "7", userToken: "token" })).toBe(false);
    expect(hasApiSession(null)).toBe(false);
  });

  it("builds catalog, search and detail parameters", () => {
    const session = { userId: "7", userToken: "token", portalCode: "portal", homePageCode: "home", version: "1" };

    expect(buildServiceParams("catalog", null, session)).toEqual({
      userId: "7", userToken: "token", portalCode: "portal", homePageCode: "home", version: "1"
    });
    expect(buildServiceParams("search", "cine", session)).toEqual({
      userToken: "token", userId: "7", portalCode: "portal", columnId: "",
      value: "cine", type: "", pageSize: 20, pageNum: 1, filter: ""
    });
    expect(buildServiceParams("detail", "100", session)).toEqual({
      userToken: "token", userId: "7", portalCode: "portal", programId: "100"
    });
  });
});

describe("service URL and errors", () => {
  it("prefers explicit method URLs and falls back to baseUrl + path", () => {
    expect(resolveServiceUrl({ catalogUrl: "https://api.test/catalog" }, "catalog")).toBe("https://api.test/catalog");
    expect(resolveServiceUrl({ baseUrl: "https://api.test/", searchPath: "v1/search" }, "search")).toBe("https://api.test/v1/search");
    expect(resolveServiceUrl({ baseUrl: "https://api.test", detailPath: "/detail" }, "detail")).toBe("https://api.test/detail");
    expect(resolveServiceUrl({}, "catalog")).toBe("");
  });

  it("describes API errors with code and message", () => {
    expect(describeServiceError({ returnCode: "500", errorMessage: "Fallo" })).toBe("500: Fallo");
    expect(describeServiceError({ code: "E1" })).toBe("E1: La API rechazó la petición");
    expect(describeServiceError({ message: "Sin datos" })).toBe("Sin datos");
    expect(describeServiceError({})).toBe("");
    expect(describeServiceError(null)).toBe("");
  });
});
