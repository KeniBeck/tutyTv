import { describe, expect, it } from "vitest";
import { createProfileRuntime, type ProfileData } from "./profileRuntime";
import { createAppState } from "./state";

function harness() {
  const state = createAppState();
  let profile = { id: "", createdAt: 0, history: [] } as ProfileData;
  const store = new Map<string, unknown>();
  const profileKey = "profile";
  const playbackKey = "playback";
  const toasts: string[] = [];
  const runtime = createProfileRuntime({
    state,
    getProfile: () => profile,
    setProfile: (next) => { profile = next; },
    readStorage: <T,>(key: string, fallback: T) => (store.has(key) ? store.get(key) as T : fallback),
    writeStorage: (key, value) => { store.set(key, value); },
    getProfileKey: () => profileKey,
    getPlaybackKey: () => playbackKey,
    request: (_method, _params, done) => {
      done(null, { item: { title: "Serie" }, episodes: [{ id: "e1" }, { id: "e2" }] });
      return true;
    },
    toast: (message) => toasts.push(message)
  });
  return { state, runtime, getProfile: () => profile, store, toasts };
}

describe("profile runtime", () => {
  it("creates and loads the viewer profile", () => {
    const test = harness();
    test.runtime.load();
    expect(test.getProfile().id).toMatch(/^TV-/);
    expect(test.getProfile().favs).toEqual({});
    expect(test.getProfile().reminders).toEqual({});
    expect(test.state.favs).toEqual({});
    expect(test.store.get("profile")).toBe(test.getProfile());
  });

  it("toggles favorites and reminders on the profile", () => {
    const test = harness();
    test.runtime.load();
    expect(test.runtime.toggleFavorite({ id: "movie" })).toBe(true);
    expect(test.state.favs.movie).toBe(true);
    expect(test.runtime.toggleFavorite({ id: "movie" })).toBe(false);
    const series = { id: "series", title: "Serie", episodes: [{ id: "e1" }] };
    expect(test.runtime.toggleReminder(series)).toBe(true);
    expect(test.runtime.isReminderActive(series)).toBe(true);
    expect(test.getProfile().reminders?.series).toBeTruthy();
  });

  it("reports increased episode counts for reminders", () => {
    const test = harness();
    test.runtime.load();
    test.runtime.toggleReminder({ id: "series", title: "Serie", episodes: [{ id: "e1" }] });
    test.runtime.checkReminders();
    expect(test.toasts[0]).toContain("Nuevos episodios");
  });
});
