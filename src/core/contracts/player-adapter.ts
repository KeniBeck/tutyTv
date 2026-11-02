export interface PlayerSource {
  url: string;
  mime?: string;
  isHls?: boolean;
}

export interface PlayerAdapter {
  load(source: PlayerSource): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  seekTo(seconds: number): void;
}
