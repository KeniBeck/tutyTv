export interface ResumeHistory {
  position?: unknown;
  duration?: unknown;
  series?: unknown;
  episodeId?: unknown;
  episodeNumber?: unknown;
  episodeTitle?: unknown;
}

export interface ResumePlan {
  position: number;
  duration: number;
  isSeries: boolean;
  episodeCount: number;
  mismatchReset: boolean;
  shouldPrompt: boolean;
}

export function resolveResumePlan(
  history: ResumeHistory | null | undefined,
  currentEpisode: { id?: unknown } | null | undefined,
  episodeCount: number,
  itemIsSeries: boolean,
  episodeExists: boolean
): ResumePlan {
  let position = history ? Number(history.position) || 0 : 0;
  const duration = history ? Number(history.duration) || 0 : 0;
  const isSeries = Boolean(history && (typeof history.series === "boolean" ? history.series : itemIsSeries));
  let mismatchReset = false;

  if (
    episodeCount > 1
    && history
    && history.episodeId
    && currentEpisode
    && String(history.episodeId) !== String(currentEpisode.id)
    && episodeExists
  ) {
    position = 0;
    mismatchReset = true;
  }

  return {
    position,
    duration,
    isSeries,
    episodeCount,
    mismatchReset,
    shouldPrompt: position > 2
  };
}

export function resolveHistoryEpisode<T extends { id?: unknown }>(
  history: ResumeHistory | null | undefined,
  episodes: ReadonlyArray<T>
): T | Record<string, unknown> | null {
  if (!history || !history.episodeId) return null;

  for (const episode of episodes) {
    if (String(episode.id) === String(history.episodeId)) {
      return episode;
    }
  }

  return {
    id: history.episodeId,
    number: history.episodeNumber,
    title: history.episodeTitle || "",
    duration: history.duration || 0
  };
}
