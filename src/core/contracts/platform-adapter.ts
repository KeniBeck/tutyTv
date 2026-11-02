export interface PlatformCapabilities {
  isWebOS: boolean;
  supportsNativeHls: boolean;
  supportsMse: boolean;
}

export interface PlatformAdapter {
  capabilities(): PlatformCapabilities;
}
