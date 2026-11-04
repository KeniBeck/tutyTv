import { describe, expect, it } from "vitest";
import { createViewerProfileId, ensureViewerProfile, type ViewerProfile } from "./viewerProfile";

function base(): ViewerProfile {
  return { id: "", createdAt: 0, history: [], reminders: {}, reminderCheckAt: 0 };
}

describe("viewer profile", () => {
  it("builds the legacy profile id from the timestamp", () => {
    expect(createViewerProfileId(1_700_000_123_456)).toBe("TV-" + "1700000123456".slice(-8));
    expect(createViewerProfileId(42)).toBe("TV-42");
  });

  it("creates and flags a profile when none is stored", () => {
    const runtime = base();
    const result = ensureViewerProfile(runtime, null, 1_700_000_123_456);
    expect(result.created).toBe(true);
    expect(result.profile).toBe(runtime);
    expect(runtime.id).toBe("TV-" + "1700000123456".slice(-8));
    expect(runtime.createdAt).toBe(1_700_000_123_456);
    expect(runtime.history).toEqual([]);
  });

  it("reuses a stored profile and repairs a missing history", () => {
    const stored = { id: "TV-1", createdAt: 1, history: [{ id: "a" }], reminders: {} } as ViewerProfile;
    const result = ensureViewerProfile(base(), stored, 2);
    expect(result.created).toBe(false);
    expect(result.profile).toBe(stored);
    expect(stored.history).toEqual([{ id: "a" }]);

    const broken = { id: "TV-2", createdAt: 1 } as unknown as ViewerProfile;
    ensureViewerProfile(base(), broken, 2);
    expect(broken.history).toEqual([]);
  });

  it("ignores stored values without an id", () => {
    const result = ensureViewerProfile(base(), { createdAt: 9 }, 3);
    expect(result.created).toBe(true);
    expect(result.profile.id).toBe("TV-3");
    expect(result.profile.createdAt).toBe(3);
  });
});
