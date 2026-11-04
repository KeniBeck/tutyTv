export interface ReminderSource {
  id?: unknown;
  title?: unknown;
  poster?: unknown;
  cover?: unknown;
  posterUrl?: unknown;
  episodes?: unknown;
  updateCount?: unknown;
  volumeCount?: unknown;
}

export interface ReminderEntry {
  id: string;
  title: string;
  poster: string;
  count: number;
  createdAt: number;
}

export type ReminderMap = Record<string, ReminderEntry>;

export interface ReminderDetailSource {
  item?: ReminderSource;
  episodes?: unknown;
}

function countValue(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  return parseInt(String(value || 0), 10) || 0;
}

export function reminderCount(item: ReminderSource): number {
  const episodes = countValue(item.episodes);
  return episodes || parseInt(String(item.updateCount || item.volumeCount || 0), 10) || 0;
}

export function buildReminderEntry(item: ReminderSource, now: number): ReminderEntry {
  return {
    id: String(item.id),
    title: String(item.title || "Contenido"),
    poster: String(item.poster || item.cover || ""),
    count: reminderCount(item),
    createdAt: now
  };
}

export function isReminderActive(itemId: unknown, reminders: ReminderMap | null | undefined): boolean {
  return Boolean(itemId && reminders && reminders[String(itemId)]);
}

export function toggleReminderEntry(
  reminders: ReminderMap,
  item: ReminderSource | null | undefined,
  now: number
): { reminders: ReminderMap; active: boolean } {
  if (!item || !item.id) {
    return { reminders, active: false };
  }

  const id = String(item.id);
  const active = !reminders[id];
  const next: ReminderMap = { ...reminders };

  if (active) {
    next[id] = buildReminderEntry(item, now);
  } else {
    delete next[id];
  }

  return { reminders: next, active };
}

export function shouldCheckReminders(
  reminders: ReminderMap | null | undefined,
  lastCheckAt: number | null | undefined,
  now: number,
  intervalMs: number = 216e5
): boolean {
  if (!reminders) return false;
  const ids = Object.keys(reminders);
  return ids.length > 0 && !(lastCheckAt && now - lastCheckAt < intervalMs);
}

export function selectReminderCheckIds(
  reminders: ReminderMap | null | undefined,
  limit: number = 10
): string[] {
  if (!reminders) return [];
  return Object.keys(reminders).slice(0, limit);
}

export function mergeReminderUpdate(
  reminder: ReminderEntry,
  response: ReminderDetailSource | null | undefined
): { reminder: ReminderEntry; increased: boolean } {
  const item = response && response.item ? response.item : {};
  const detailEpisodes = response && response.episodes;
  const count = countValue(detailEpisodes) || parseInt(String(item.updateCount || item.volumeCount || 0), 10) || 0;
  const increased = count > 0 && reminder.count > 0 && count > reminder.count;

  return {
    reminder: {
      ...reminder,
      count: count > 0 ? count : reminder.count,
      title: String(item.title || reminder.title),
      poster: String(item.poster || item.posterUrl || reminder.poster)
    },
    increased
  };
}
