export function attachLegacyRuntime(runtime, deps) {
  if (!runtime) {
    return;
  }
  var navigationDeps = deps.getNavigationStageDeps();
  runtime.attachNavigationActions && runtime.attachNavigationActions(runtime.createNavigationActionsHost(navigationDeps));
  runtime.attachNavigation && runtime.attachNavigation(runtime.createNavigationHost(navigationDeps));
  var playerWiringDeps = deps.getPlayerWiringDeps();
  runtime.attachPlayerSessionWiring && runtime.attachPlayerSessionWiring(playerWiringDeps);
  runtime.attachPlayerSourceWiring && runtime.attachPlayerSourceWiring(playerWiringDeps);
  runtime.attachPlayerControlWiring && runtime.attachPlayerControlWiring(playerWiringDeps);
  if (!runtime.attachFocus) {
    return;
  }
  var uiRuntimeDeps = deps.getUiRuntimeDeps();
  if (runtime.createHomeRuntimeHosts) {
    var homeHosts = runtime.createHomeRuntimeHosts(uiRuntimeDeps);
    runtime.attachScreenFocus && runtime.attachScreenFocus(homeHosts.screenFocus);
    runtime.attachPosterCard && runtime.attachPosterCard(homeHosts.poster);
    runtime.attachLazyPosters && runtime.attachLazyPosters(homeHosts.lazyPosters);
    runtime.attachHomeTabs && runtime.attachHomeTabs(homeHosts.homeTabs);
    runtime.attachLiveFavorites && runtime.attachLiveFavorites(homeHosts.liveFavorites);
    runtime.attachPlayerLiveCategories && runtime.attachPlayerLiveCategories(homeHosts.playerLiveCategories);
    runtime.attachHomeAddons && runtime.attachHomeAddons(homeHosts.homeAddons);
    runtime.attachLiveLoader && runtime.attachLiveLoader(homeHosts.liveLoader);
  }
  runtime.attachFocus(runtime.createFocusHost(deps.getFocusHostDeps()));
  if (runtime.createLiveRuntimeHosts) {
    var liveHosts = runtime.createLiveRuntimeHosts(uiRuntimeDeps);
    runtime.attachLiveList && runtime.attachLiveList(liveHosts.liveList);
    runtime.attachPreview && runtime.attachPreview(liveHosts.preview);
    runtime.attachLiveMenu && runtime.attachLiveMenu(liveHosts.liveMenu);
    runtime.attachAddonsDialog && runtime.attachAddonsDialog(liveHosts.addonsDialog);
  }
  if (runtime.createScreenRuntimeHosts) {
    var screenHosts = runtime.createScreenRuntimeHosts(uiRuntimeDeps);
    runtime.attachSearch && runtime.attachSearch(screenHosts.search);
    runtime.attachSettings && runtime.attachSettings(screenHosts.settings);
    runtime.attachDetail && runtime.attachDetail(screenHosts.detail);
    runtime.attachResume && runtime.attachResume(screenHosts.resume);
  }
  if (runtime.createPlayerRuntimeHosts) {
    var playerHosts = runtime.createPlayerRuntimeHosts(uiRuntimeDeps);
    runtime.attachPlayerSession && runtime.attachPlayerSession(playerHosts.playerSession);
    runtime.attachPlayerResolve && runtime.attachPlayerResolve(playerHosts.playerResolve);
    runtime.attachPlayerLive && runtime.attachPlayerLive(playerHosts.playerLive);
    runtime.attachPlayerRouting && runtime.attachPlayerRouting(playerHosts.playerRouting);
    runtime.attachPlayerInfobar && runtime.attachPlayerInfobar(playerHosts.playerInfobar);
    runtime.attachLiveChannelPanel && runtime.attachLiveChannelPanel(playerHosts.liveChannelPanel);
    runtime.attachPlayerInfoContent && runtime.attachPlayerInfoContent(playerHosts.playerInfoContent);
    runtime.attachPlayerSubtitles && runtime.attachPlayerSubtitles(playerHosts.playerSubtitles);
    runtime.attachNextEpisodePrompt && runtime.attachNextEpisodePrompt(playerHosts.nextEpisodePrompt);
    runtime.attachNextEpisodeAdvance && runtime.attachNextEpisodeAdvance(playerHosts.nextEpisodeAdvance);
    runtime.attachPlayerAudio && runtime.attachPlayerAudio(playerHosts.playerAudio);
    runtime.attachPlaySettings && runtime.attachPlaySettings(playerHosts.playSettings);
    runtime.attachPlayerVideoSettings && runtime.attachPlayerVideoSettings(playerHosts.playerVideoSettings);
    runtime.attachEpisodeBrowser && runtime.attachEpisodeBrowser(playerHosts.episodeBrowser);
    runtime.attachAppLifecycle && runtime.attachAppLifecycle(playerHosts.appLifecycle);
    runtime.attachWebOsKeepAlive && runtime.attachWebOsKeepAlive(playerHosts.webOsKeepAlive);
    runtime.attachDeepLink && runtime.attachDeepLink(playerHosts.deepLink);
  }
}
