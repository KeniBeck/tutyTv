export type LegacyHlsSlot = "__tutyHls" | "__tutyPreviewHls";

export interface LegacyHlsRegistry {
  __tutyHls?: { destroy(): void } | null;
  __tutyPreviewHls?: { destroy(): void } | null;
}

export function destroyLegacyHls(registry: LegacyHlsRegistry, slot: LegacyHlsSlot): void {
  if (registry[slot]) {
    try {
      registry[slot]!.destroy();
    } catch {
      // El runtime legacy continúa limpiando incluso si destroy falla.
    }
  }
  registry[slot] = null;
}

export function scheduleGuardedRetry(
  schedule: (callback: () => void) => unknown,
  isCurrent: () => boolean,
  retry: () => void
): void {
  schedule(() => {
    if (isCurrent()) {
      retry();
    }
  });
}
