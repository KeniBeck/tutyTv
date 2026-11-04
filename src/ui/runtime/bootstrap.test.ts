import { describe, expect, it, vi } from "vitest";
import { startBootstrap, type BootstrapHost } from "./bootstrap";

function createHarness() {
  const windowListeners: Record<string, EventListener> = {};
  const documentListeners: Record<string, EventListener> = {};
  const calls: string[] = [];
  const host: BootstrapHost = {
    attachRuntime: () => calls.push("attach"),
    resize: () => calls.push("resize"),
    installNavigation: () => calls.push("navigation"),
    onPopState: () => calls.push("popstate"),
    onClick: () => calls.push("click"),
    startKeepAlive: () => calls.push("keepalive"),
    scheduleWelcome: () => calls.push("welcome"),
    loadCatalogs: () => calls.push("catalogs"),
    loadLive: () => calls.push("live"),
    installDebugApi: () => calls.push("debug"),
    applyDeepLink: () => calls.push("deep-link")
  };
  const targetWindow = {
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      windowListeners[type] = listener;
    })
  };
  const targetDocument = {
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      documentListeners[type] = listener;
    })
  };
  return { host, targetWindow, targetDocument, windowListeners, documentListeners, calls };
}

describe("bootstrap", () => {
  it("runs the startup sequence in order", () => {
    const harness = createHarness();
    startBootstrap(harness.host, harness.targetWindow, harness.targetDocument);
    expect(harness.calls).toEqual([
      "attach", "resize", "navigation", "keepalive", "welcome",
      "catalogs", "live", "debug", "deep-link"
    ]);
  });

  it("installs resize, popstate and click listeners", () => {
    const harness = createHarness();
    startBootstrap(harness.host, harness.targetWindow, harness.targetDocument);
    harness.windowListeners.resize?.(new Event("resize"));
    harness.windowListeners.popstate?.(new Event("popstate"));
    harness.documentListeners.click?.(new Event("click"));
    expect(harness.calls).toEqual(expect.arrayContaining(["resize", "popstate", "click"]));
    expect(harness.targetWindow.addEventListener).toHaveBeenCalledWith("resize", expect.any(Function), false);
    expect(harness.targetWindow.addEventListener).toHaveBeenCalledWith("popstate", expect.any(Function), false);
    expect(harness.targetDocument.addEventListener).toHaveBeenCalledWith("click", expect.any(Function), false);
  });
});
