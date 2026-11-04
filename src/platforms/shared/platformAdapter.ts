import type { PlatformAdapter, PlatformCapabilities } from "../../core/contracts/platform-adapter";

export interface PlatformProbe {
  userAgent?: string;
  canPlayType?: (mime: string) => string;
  hasMediaSource?: boolean;
  hasPalmSystem?: boolean;
}

export interface LegacyPlatformAdapter extends PlatformAdapter {
  prefersNativeTvPlayback(): boolean;
  canUseLunaService(bridge: unknown): boolean;
  canPlayPreviewHls(video: { canPlayType?: (mime: string) => string }): boolean;
  platformBack(environment: LegacyPlatformBackEnvironment): void;
}

export interface LegacyPlatformBackEnvironment {
  webOSTV?: { platformBack?: () => void } | null;
  PalmSystem?: { platformBack?: () => void } | null;
}

const HLS_MIME_TYPES = [
  "application/vnd.apple.mpegurl",
  "application/x-mpegURL",
  "audio/mpegurl"
];

export function detectPlatformCapabilities(probe: PlatformProbe = {}): PlatformCapabilities {
  const userAgent = probe.userAgent ?? "";
  const canPlayType = probe.canPlayType ?? (() => "");
  const isWebOS =
    probe.hasPalmSystem === true || /web0s|webos|lg browser/i.test(userAgent);

  return {
    isWebOS,
    supportsNativeHls: HLS_MIME_TYPES.some((mime) => canPlayType(mime) !== ""),
    supportsMse: probe.hasMediaSource === true
  };
}

export function createPlatformAdapter(probe: PlatformProbe = {}): LegacyPlatformAdapter {
  return {
    capabilities: () => detectPlatformCapabilities(probe),
    prefersNativeTvPlayback: () => /webOS|SmartTV|Large Screen/i.test(probe.userAgent ?? ""),
    canUseLunaService: (bridge) => !!bridge,
    canPlayPreviewHls: (video) => !!(video.canPlayType && video.canPlayType("application/vnd.apple.mpegurl")),
    platformBack: (environment) => {
      if (environment.webOSTV && environment.webOSTV.platformBack) {
        environment.webOSTV.platformBack();
      } else if (environment.PalmSystem && environment.PalmSystem.platformBack) {
        environment.PalmSystem.platformBack();
      }
    }
  };
}
