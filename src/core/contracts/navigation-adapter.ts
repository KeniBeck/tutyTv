export interface NavigationAdapter {
  onBack(handler: () => void): void;
  onDirectional(handler: (direction: "up" | "down" | "left" | "right") => void): void;
  onEnter(handler: () => void): void;
}
