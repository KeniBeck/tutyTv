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

export interface BootstrapHostDeps {
  attachRuntime(): void;
  resize(): void;
  installNavigation(): void;
  onPopState(): void;
  onClick(event: Event): void;
  startKeepAlive(): void;
  scheduleWelcome(): void;
  loadCatalogs(): void;
  loadLive(): void;
  debug: Record<string, unknown>;
}

export function createBootstrapHost(deps: BootstrapHostDeps): BootstrapHost {
  return {
    attachRuntime: deps.attachRuntime,
    resize: deps.resize,
    installNavigation: deps.installNavigation,
    onPopState: deps.onPopState,
    onClick: deps.onClick,
    startKeepAlive: deps.startKeepAlive,
    scheduleWelcome: deps.scheduleWelcome,
    loadCatalogs: deps.loadCatalogs,
    loadLive: deps.loadLive,
    installDebugApi: function installDebugApi() {
      const runtime = (window as unknown as { TutyUI?: { installDebugApi?: (info: Record<string, unknown>) => void } }).TutyUI;
      if (runtime && runtime.installDebugApi) {
        runtime.installDebugApi({
          version: "4.34.4",
          ...deps.debug
        });
      }
    },
    applyDeepLink: function applyDeepLink() {
      const runtime = (window as unknown as {
        TutyUI?: { hasDeepLinkRuntime?: () => boolean; applyDeepLink?: () => void };
      }).TutyUI;
      if (runtime && runtime.hasDeepLinkRuntime && runtime.hasDeepLinkRuntime() && runtime.applyDeepLink) {
        runtime.applyDeepLink();
      }
    }
  };
}
