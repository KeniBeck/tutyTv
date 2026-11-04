import { describe, expect, it } from "vitest";
import {
  buildReminderEntry,
  isReminderActive,
  mergeReminderUpdate,
  reminderCount,
  selectReminderCheckIds,
  shouldCheckReminders,
  toggleReminderEntry
} from "./reminders";

describe("reminders", () => {
  const item = {
    id: 7,
    title: "Serie",
    poster: "poster.jpg",
    episodes: [{ id: 1 }, { id: 2 }],
    updateCount: 9
  };

  it("builds entries from episodes or update counters", () => {
    expect(reminderCount(item)).toBe(2);
    expect(reminderCount({ updateCount: "4" })).toBe(4);
    expect(reminderCount({ volumeCount: 3 })).toBe(3);
    expect(buildReminderEntry(item, 1000)).toEqual({
      id: "7", title: "Serie", poster: "poster.jpg", count: 2, createdAt: 1000
    });
  });

  it("toggles without mutating the source map", () => {
    const original = {};
    const added = toggleReminderEntry(original, item, 1000);
    expect(added.active).toBe(true);
    expect(added.reminders["7"]).toMatchObject({ id: "7", count: 2 });
    expect(original).toEqual({});
    expect(isReminderActive("7", added.reminders)).toBe(true);

    const removed = toggleReminderEntry(added.reminders, item, 2000);
    expect(removed.active).toBe(false);
    expect(removed.reminders["7"]).toBeUndefined();
  });

  it("checks at most ten reminders after the interval", () => {
    const reminders = Object.fromEntries(Array.from({ length: 12 }, (_, index) => [
      String(index), { id: String(index), title: "T", poster: "", count: 0, createdAt: 0 }
    ]));

    expect(shouldCheckReminders(reminders, 0, 1000)).toBe(true);
    expect(shouldCheckReminders(reminders, 1000, 2000)).toBe(false);
    expect(shouldCheckReminders(reminders, 1000, 3000)).toBe(false);
    expect(shouldCheckReminders(reminders, 1000, 200_000_000)).toBe(true);
    expect(shouldCheckReminders({}, 0, 1000)).toBe(false);
    expect(selectReminderCheckIds(reminders)).toHaveLength(10);
  });

  it("merges detail updates and detects new episodes", () => {
    const reminder = { id: "7", title: "Serie", poster: "old.jpg", count: 2, createdAt: 0 };
    const merged = mergeReminderUpdate(reminder, {
      item: { title: "Serie nueva", poster: "new.jpg" },
      episodes: [{ id: 1 }, { id: 2 }, { id: 3 }]
    });

    expect(merged.increased).toBe(true);
    expect(merged.reminder).toEqual({
      id: "7", title: "Serie nueva", poster: "new.jpg", count: 3, createdAt: 0
    });

    const same = mergeReminderUpdate(merged.reminder, { item: {}, episodes: [] });
    expect(same.increased).toBe(false);
    expect(same.reminder.count).toBe(3);
    expect(same.reminder.title).toBe("Serie nueva");
  });
});
