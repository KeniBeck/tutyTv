import {
  ensureViewerProfile,
  isReminderActive,
  mergePlaybackPreferences,
  mergeReminderUpdate,
  selectReminderCheckIds,
  shouldCheckReminders,
  toggleCatalogFavorite,
  toggleReminderEntry
} from "../../platforms/shared/legacyCoreBridge";
import type { ReminderEntry, ReminderMap } from "../../core/usecases/reminders/reminders";
import type { ViewerProfile } from "../../core/usecases/storage/viewerProfile";
import type { AppState } from "./state";
import type { ServiceCallback } from "./service";

export type ProfileReminder = ReminderEntry;
export type ProfileData = ViewerProfile;

export interface ProfileItem {
  id?: string | number | null;
  [key: string]: unknown;
}

export interface ProfileRuntimeDeps {
  state: AppState;
  getProfile(): ViewerProfile;
  setProfile(profile: ViewerProfile): void;
  readStorage<T>(key: string, fallback: T): T;
  writeStorage(key: string, value: unknown): void;
  getProfileKey(): string;
  getPlaybackKey(): string;
  request(method: string, params: Record<string, unknown>, done: ServiceCallback): boolean;
  toast(message: string): void;
}

export interface ProfileRuntime {
  load(): void;
  save(): void;
  savePlayback(): void;
  toggleFavorite(item: ProfileItem): boolean;
  isReminderActive(item: ProfileItem): boolean;
  toggleReminder(item: ProfileItem): boolean;
  checkReminders(): void;
}

export function createProfileRuntime(deps: ProfileRuntimeDeps): ProfileRuntime {
  function save(): void {
    deps.writeStorage(deps.getProfileKey(), deps.getProfile());
  }

  function savePlayback(): void {
    deps.writeStorage(deps.getPlaybackKey(), deps.state.playback);
  }

  function load(): void {
    const playback = deps.readStorage<Record<string, unknown> | null>(deps.getPlaybackKey(), null);
    if (playback) {
      mergePlaybackPreferences(deps.state.playback as never, playback as never);
    }
    const result = ensureViewerProfile(
      deps.getProfile(),
      deps.readStorage<ProfileData | null>(deps.getProfileKey(), null),
      Date.now()
    );
    const profile = result.profile;
    deps.setProfile(profile);
    if (result.created) {
      save();
    }
    if (!profile.favs) profile.favs = {};
    if (!profile.reminders) profile.reminders = {};
    deps.state.favs = (profile.favs || {}) as Record<string, boolean>;
  }

  function toggleFavorite(item: ProfileItem): boolean {
    if (!item || !item.id) {
      return false;
    }
    const profile = deps.getProfile();
    const result = toggleCatalogFavorite(deps.state.favs, item.id);
    deps.state.favs = result.favorites;
    profile.favs = deps.state.favs as unknown as Record<string, unknown>;
    save();
    return result.active;
  }

  function reminderActive(item: ProfileItem): boolean {
    return isReminderActive(item && item.id, deps.getProfile().reminders as ReminderMap | undefined);
  }

  function toggleReminder(item: ProfileItem): boolean {
    if (!item || !item.id) {
      return false;
    }
    const profile = deps.getProfile();
    const result = toggleReminderEntry((profile.reminders || {}) as ReminderMap, item as never, Date.now());
    profile.reminders = result.reminders as unknown as Record<string, unknown>;
    save();
    return result.active;
  }

  function checkReminders(): void {
    const profile = deps.getProfile();
    const now = Date.now();
    const reminders = (profile.reminders || {}) as ReminderMap;
    const checkAt = Number(profile.reminderCheckAt) || 0;
    if (!shouldCheckReminders(reminders, checkAt, now)) {
      return;
    }
    const ids = selectReminderCheckIds(reminders);
    if (!ids.length) {
      return;
    }
    profile.reminderCheckAt = now;
    save();
    const titles: string[] = [];
    let completed = 0;
    for (const id of ids) {
      deps.request("detail", { contentId: id }, function detailDone(error, response) {
        completed += 1;
        if (!error && response && (response as { returnValue?: boolean }).returnValue !== false) {
          const reminder = reminders[id];
          if (reminder) {
            const merged = mergeReminderUpdate(reminder, response);
            if (merged.increased) {
              titles.push(merged.reminder.title || "Una serie");
            }
            reminders[id] = merged.reminder;
            profile.reminders = reminders as unknown as Record<string, unknown>;
            save();
          }
        }
        if (completed === ids.length && titles.length) {
          deps.toast("Nuevos episodios: " + titles.slice(0, 3).join(", "));
        }
      });
    }
  }

  return {
    load,
    save,
    savePlayback,
    toggleFavorite,
    isReminderActive: reminderActive,
    toggleReminder,
    checkReminders
  };
}
