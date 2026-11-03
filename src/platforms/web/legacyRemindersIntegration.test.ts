import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");
const detailSource = readFileSync(new URL(
  "../../ui/screens/detail/detailScreen.ts",
  import.meta.url
), "utf8");

const snippet = source.match(
  / {4}function legacyIsReminderActive\([\s\S]*?(?= {4}function legacyFormatPlaybackTime\()/
)?.[0];

interface Reminder {
  id: string;
  title: string;
  poster: string;
  count: number;
  createdAt: number;
}

describe("legacy reminders integration", () => {
  it("keeps reminder state and checks connected to Core", () => {
    expect(source).toMatch(/legacyIsReminderActive\(e && e\.id, X\.reminders\)/);
    expect(source).toMatch(/legacyToggleReminderEntry\(X\.reminders, e, Date\.now\(\)\)/);
    expect(source).toMatch(/legacyShouldCheckReminders\(X\.reminders, X\.reminderCheckAt, now\)/);
    expect(source).toMatch(/legacySelectReminderCheckIds\(X\.reminders\)/);
    expect(source).toMatch(/legacyMergeReminderUpdate\(l, r\)/);
  });

  it("exposes the reminder button for movies and series", () => {
    expect(detailSource).toMatch(/icon_detail_subscribe\.png/);
    expect(detailSource).toMatch(/host\.toggleReminder\(item\)/);
  });

  it.each([true, false])("toggles, throttles and merges reminders (core available: %s)", (withCore) => {
    expect(snippet).toBeTruthy();
    const runtime = runInNewContext(
      `${snippet}\n({ legacyIsReminderActive, legacyToggleReminderEntry, legacyShouldCheckReminders, legacySelectReminderCheckIds, legacyMergeReminderUpdate })`,
      { window: { TutyCore: withCore ? core : undefined } }
    ) as {
      legacyIsReminderActive(itemId: unknown, reminders: Record<string, Reminder>): boolean;
      legacyToggleReminderEntry(
        reminders: Record<string, Reminder>,
        item: object,
        now: number
      ): { reminders: Record<string, Reminder>; active: boolean };
      legacyShouldCheckReminders(reminders: Record<string, Reminder>, lastCheckAt: number, now: number): boolean;
      legacySelectReminderCheckIds(reminders: Record<string, Reminder>): string[];
      legacyMergeReminderUpdate(reminder: Reminder, response: object): { reminder: Reminder; increased: boolean };
    };

    const item = { id: 7, title: "Serie", poster: "poster.jpg", episodes: [{ id: 1 }, { id: 2 }] };
    const original: Record<string, Reminder> = {};
    const added = runtime.legacyToggleReminderEntry(original, item, 1000);
    expect(added.active).toBe(true);
    expect(added.reminders["7"]).toMatchObject({ id: "7", title: "Serie", count: 2 });
    expect(original).toEqual({});
    expect(runtime.legacyIsReminderActive("7", added.reminders)).toBe(true);
    expect(runtime.legacyToggleReminderEntry(added.reminders, item, 2000).active).toBe(false);
    expect(runtime.legacyShouldCheckReminders(added.reminders, 0, 1000)).toBe(true);
    expect(runtime.legacyShouldCheckReminders(added.reminders, 1000, 2000)).toBe(false);
    expect(runtime.legacySelectReminderCheckIds(added.reminders)).toEqual(["7"]);

    const merged = runtime.legacyMergeReminderUpdate(added.reminders["7"]!, {
      item: { title: "Serie nueva", poster: "new.jpg" },
      episodes: [{ id: 1 }, { id: 2 }, { id: 3 }]
    });
    expect(merged.increased).toBe(true);
    expect(merged.reminder).toMatchObject({ title: "Serie nueva", poster: "new.jpg", count: 3 });
  });
});
