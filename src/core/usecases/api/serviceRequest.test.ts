import { describe, expect, it } from "vitest";
import { buildDevServiceUrl, buildQueryString } from "./serviceRequest";

describe("service request URLs", () => {
  it("encodes every own parameter like the legacy builder", () => {
    expect(buildQueryString({})).toBe("");
    expect(buildQueryString({
      root: "movies",
      query: "la casa",
      page: 2,
      empty: undefined,
      nil: null
    })).toBe("root=movies&query=la%20casa&page=2&empty=undefined&nil=null");
  });

  it("joins the dev base, method and query", () => {
    expect(buildDevServiceUrl("http://127.0.0.1:3000/", "home", { root: "tv" }))
      .toBe("http://127.0.0.1:3000/home?root=tv");
    expect(buildDevServiceUrl("http://127.0.0.1:3000", "ping", {}))
      .toBe("http://127.0.0.1:3000/ping?");
  });
});
