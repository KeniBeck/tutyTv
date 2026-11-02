export interface HlsRecoveryTarget {
  startLoad(): void;
  recoverMediaError(): void;
}

export interface HlsErrorData {
  fatal?: unknown;
  type?: unknown;
}

export interface HlsErrorTypes {
  NETWORK_ERROR: unknown;
  MEDIA_ERROR: unknown;
}

export function handleHlsError(
  hls: HlsRecoveryTarget,
  data: HlsErrorData | null | undefined,
  getErrorTypes: () => HlsErrorTypes,
  onFatal: () => void
): void {
  if (!data || !data.fatal) {
    return;
  }

  if (data.type === getErrorTypes().NETWORK_ERROR) {
    try {
      hls.startLoad();
    } catch {
      return;
    }
  } else if (data.type === getErrorTypes().MEDIA_ERROR) {
    try {
      hls.recoverMediaError();
    } catch {
      return;
    }
  } else {
    onFatal();
  }
}
