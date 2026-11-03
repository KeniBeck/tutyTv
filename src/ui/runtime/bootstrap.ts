export interface BootstrapHost {
  attachRuntime(): void;
  resize(): void;
  installNavigation(): void;
  onPopState(): void;
  onClick(event: Event): void;
  startKeepAlive(): void;
  scheduleWelcome(): void;
  loadCatalogs(): void;
  loadLive(): void;
  installDebugApi(): void;
  applyDeepLink(): void;
}

interface BootstrapWindow {
  addEventListener(type: string, listener: EventListener, options?: boolean | AddEventListenerOptions): void;
}

interface BootstrapDocument {
  addEventListener(type: string, listener: EventListener, options?: boolean | AddEventListenerOptions): void;
}

export function startBootstrap(
  host: BootstrapHost,
  targetWindow: BootstrapWindow = window,
  targetDocument: BootstrapDocument = document
): void {
  host.attachRuntime();
  host.resize();
  targetWindow.addEventListener("resize", function onResize() {
    host.resize();
  }, false);
  host.installNavigation();
  targetWindow.addEventListener("popstate", function onPopState() {
    host.onPopState();
  }, false);
  targetDocument.addEventListener("click", function onClick(event: Event) {
    host.onClick(event);
  }, false);
  host.startKeepAlive();
  host.scheduleWelcome();
  host.loadCatalogs();
  host.loadLive();
  host.installDebugApi();
  host.applyDeepLink();
}
