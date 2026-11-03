import { describe, expect, it, vi } from "vitest";
import { createServiceClient, type ServiceDependencies } from "./service";

function dependencies(overrides: Partial<ServiceDependencies> = {}): ServiceDependencies {
  return {
    getServiceId: () => "com.webosflux.xuptertv.fidelity.service",
    getTimeout: () => 20000,
    getDevServiceUrl: () => undefined,
    canUseLuna: () => false,
    getWebOs: () => undefined,
    buildDevUrl: (base, method) => `${base}/${method}`,
    requestDev: vi.fn(),
    ...overrides
  };
}

describe("service client", () => {
  it("uses Luna when available and reports success", () => {
    const request = vi.fn((_uri: string, options: { onSuccess(response: unknown): void }) => {
      options.onSuccess({ returnValue: true });
    });
    const done = vi.fn();
    const client = createServiceClient(dependencies({
      canUseLuna: () => true,
      getWebOs: () => ({ service: { request } })
    }));

    expect(client.request("detail", { contentId: "1" }, done)).toBe(true);
    expect(request).toHaveBeenCalledOnce();
    expect(done).toHaveBeenCalledWith(null, { returnValue: true });
  });

  it("falls back to the development URL when Luna is unavailable", () => {
    const requestDev = vi.fn((_url: string, done: (error: string | null, response: unknown) => void) => {
      done(null, { ok: true });
    });
    const done = vi.fn();
    const client = createServiceClient(dependencies({
      getDevServiceUrl: () => "http://127.0.0.1:18998",
      requestDev
    }));

    expect(client.request("liveCategories", {}, done)).toBe(true);
    expect(requestDev).toHaveBeenCalledWith("http://127.0.0.1:18998/liveCategories", expect.any(Function));
    expect(done).toHaveBeenCalledWith(null, { ok: true });
  });

  it("reports the original unavailable error when no transport exists", () => {
    const done = vi.fn();
    const client = createServiceClient(dependencies());
    expect(client.request("detail", {}, done)).toBe(false);
    expect(done).toHaveBeenCalledWith("El servicio TutyTV no está disponible", null);
  });

  it("finishes only once", () => {
    const done = vi.fn();
    const client = createServiceClient(dependencies({
      canUseLuna: () => true,
      getWebOs: () => ({
        service: {
          request: (_uri, options) => {
            options.onFailure({ errorText: "boom" });
            options.onFailure({ errorText: "again" });
          }
        }
      })
    }));

    expect(client.request("detail", {}, done)).toBe(true);
    expect(done).toHaveBeenCalledOnce();
    expect(done).toHaveBeenCalledWith("boom", null);
  });
});
