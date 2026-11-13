export interface PlatformCapabilities {
  isWebOS: boolean;
  isTizen: boolean;
  supportsNativeHls: boolean;
  supportsMse: boolean;
}

export interface PlatformAdapter {
  capabilities(): PlatformCapabilities;
}
