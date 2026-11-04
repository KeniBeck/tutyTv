export function createLegacyBootstrapDeps(ctx) {
  return {
    attachRuntime: ctx.attachRuntime,
    resize: ctx.resize,
    installNavigation: function installNavigation() {
      ctx.installNavigation(document, ctx.handleKey);
    },
    onPopState: ctx.onPopState,
    onClick: function onClick(event) {
      var target = ctx.closest(event.target, ".focusable");
      if (target) {
        ctx.focus(target, true);
        if (target._activate) target._activate();
      }
    },
    startKeepAlive: function startKeepAlive() {
      var runtime = window.TutyUI;
      runtime && runtime.startWebOsKeepAlive && runtime.startWebOsKeepAlive();
    },
    scheduleWelcome: function scheduleWelcome() {
      ctx.setWelcomeTimer(setTimeout(ctx.showHome, 2600));
    },
    loadCatalogs: ctx.loadCatalogs,
    loadLive: ctx.loadLive,
    debug: {
      state: ctx.state,
      vod: ctx.catalog,
      channels: ctx.channels,
      api: ctx.status,
      portal: ctx.portal,
      service: ctx.request,
      refreshPortal: ctx.refreshPortal,
      reloadVod: ctx.loadCatalogs,
      skipWelcome: ctx.showHome,
      showScreen: ctx.showScreen,
      selectTab: ctx.selectTab,
      openDetail: function openDetail(index) {
        ctx.openDetail(ctx.catalog[index] || ctx.catalog[0]);
      },
      openSearch: ctx.openSearch,
      openSettings: ctx.openSettings,
      openLiveCategories: ctx.openLiveCategories,
      openLiveSearch: ctx.openLiveSearch,
      toggleLiveFavorites: ctx.toggleLiveFavorites,
      openPlayer: function openPlayer(mode, index) {
        ctx.openPlayer(mode, ctx.catalog[index] || null);
      },
      focus: function focus(target) {
        var element = typeof target === "string" ? document.querySelector(target) : target;
        if (element) ctx.focus(element);
      },
      handleKey: function handleKey(code) {
        ctx.handleKey({ keyCode: code, preventDefault: function preventDefault() {} });
      },
      search: ctx.setSearchQuery,
      openSettingsPanel: function openSettingsPanel(panel) {
        ctx.openSettingsPanel(panel, true);
      }
    }
  };
}

export function startLegacyBootstrap(runtime, deps) {
  if (runtime && runtime.startBootstrap) {
    runtime.startBootstrap(runtime.createBootstrapHost(deps));
  }
}
