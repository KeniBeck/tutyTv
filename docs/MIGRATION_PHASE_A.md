# Fase A - Migracion modular total

Fecha: 2026-11-02  
Estado: **A0-A4 ejecutados**; A5 en curso (visibilidad de reproduccion). Sin cambios visuales.  
Base: TutyTV 1.6.17, 318 pruebas iniciales, UI actual congelada.

## 0. Estado de ejecucion

A0 y A1 ejecutados sin cambios visuales:

- `src/ui` con runtime compartido (`state`, `dom`, `layout`, `focus`, `router`,
  `service`).
- `tuty-ui.js` generado por `build:ui` (target `chrome53`).
- `index.html` carga `tuty-core.js` -> `tuty-ui.js` -> `app.js`.
- `app.js` delega en `window.TutyUI` con fallback legacy: helpers DOM, estado
  inicial, foco `tt`/`at`, cambio de pantalla `nt`, escalado `mr` y cliente de
  servicio `q`.
- `build:web`, `build:ui` y `build:ipk` encadenan el nuevo artefacto.
- Vite/plugin de desarrollo sirve `src/ui/dev.ts` sin depender del artefacto.
- 379 pruebas verdes (17 del runtime UI + 5 de paginas Home + 14 de live UI
  + 6 de busqueda + 4 de ajustes + 6 de detalle/reanudacion
  + 1 de ciclo de visibilidad + 5 de preview live
  + 1 de integracion de preview + 1 de reutilizacion de sesion).
- Lint, typecheck, build core, build UI, build web y build webOS OK.
- A2.1: paginas Home VOD 1-6 movidas a
  `src/ui/screens/home/homePages.ts`.
- A2.2: lista/zapping en `liveList.ts`; categorias y busqueda en
  `liveMenu.ts`; dialog de addons en `addonsDialog.ts`.
- A3: busqueda, teclado, resultados y filtros en
  `src/ui/screens/search/searchScreen.ts`; ajustes, perfil, historial,
  favoritos y recordatorios en `src/ui/screens/settings/settingsScreen.ts`.
- `app.js` delega y conserva fallback legacy en todos los puntos.
- Preview de TV, resolucion de senal y HLS de preview ya viven en
  `src/ui/screens/player/previewPlayer.ts`; `app.js` conserva el fallback
  legacy. La sesion del reproductor completo sigue en `app.js` para A5.1.
- IPK 1.6.21 generado para prueba web/TV.
- A4.0: el boton de recordatorio del detalle ya esta disponible tambien para
  peliculas, no solo para series.
- A4.1: detalle, temporadas, rangos de episodios y dialogos de reanudar
  extraidos a `src/ui/screens/detail/`. `app.js` mantiene datos, reproduccion
  y fallback legacy.
- A4.2: el bloque inferior del detalle ahora es verticalmente desplazable
  (`.detail-bottom.scrollable`), para que episodios y relacionados no queden
  cortados en series largas.
- A4.3: el foco vertical del detalle respeta el orden temporada/rango ->
  episodios -> relacionados y al subir vuelve a la seccion de temporadas antes
  de los botones superiores.
- IPK 1.6.25 generado para prueba web/TV.
- A5.0: al ocultar la web/app la reproduccion continua en segundo plano, igual
  que antes, sin abortar la sesion ni reiniciar el video. Al volver solo se
  reanuda si el navegador pauso el medio por su cuenta, conservando la
  posicion y el canal.
- A5.1a: preview live extraido a `previewPlayer.ts` con debounce, resolucion
  de canal, HLS.js, estados de carga y limpieza; `app.js` delega y mantiene
  fallback.
- IPK 1.6.26 generado para prueba web/TV.
- IPK 1.6.27 generado para prueba web/TV.
- IPK 1.6.28 generado para prueba web/TV.
- A5.1b: al entrar a pantalla completa desde el preview del detalle se reutiliza
  la sesion activa. La comparacion de titulo/episodio usa `id`, no identidad de
  objeto, y una segunda activacion no vuelve a cargar el stream.
- IPK 1.6.29 generado para prueba web/TV.
- A5.1c: la sesion del preview registra explicitamente el titulo/episodio que
  esta cargado en `playerSourceItem`/`playerSourceEpisode`. Al entrar a pantalla
  completa se compara contra ese registro, no contra la identidad del objeto
  del catalogo, para no recargar el mismo stream.
- IPK 1.6.30 generado para prueba web/TV.
- A5.1d: el registro `playerSourceItem`/`playerSourceEpisode` se asigna despues
  de que `rr()` termina su limpieza, tanto para stream directo como para
  resolucion de portal, para que la entrada a pantalla completa reuse la
  sesion real del preview.
- IPK 1.6.31 generado para prueba web/TV.
- A5.1e: corregido el argumento de `shouldReusePlaybackSession`; se pasaba un
  booleano (`"detail" === j.screen`) en lugar del nombre de pantalla, por lo que
  Core siempre devolvia `false` y se recargaba el video al entrar a pantalla
  completa. Ahora se pasa `j.screen`.
- IPK 1.6.32 generado para prueba web/TV.
- A5.1b: transicion a pantalla completa y seguimiento de la fuente activa
  (`playerSourceItem`/`playerSourceEpisode`) extraidos a
  `src/ui/screens/player/playerSession.ts`. La comparacion por `id`, la
  reutilizacion de sesion, la captura de posicion y el arranque del reproductor
  quedan en el modulo; `app.js` delega con `openFullscreenPlayer` y conserva el
  fallback legacy. `markPlayerSource`/`clearPlayerSource` mantienen sincronizado
  el registro con `ar`/`sr`.
- IPK 1.6.33 generado para prueba web/TV.
- A5.1c: arranque de reproduccion extraido a `startPlayerPlayback` en
  `playerSession.ts`: limpieza previa, preparacion de media info, resolucion de
  portales y carga de streams directos. `app.js` delega en `sr` y mantiene el
  fallback legacy. La resolucion (`or`), el pipeline de video (`rr`/`ar`) y el
  enrutado de pantalla (`dr`/`ur`) siguen en `app.js` por su acoplamiento a
  relay/HLS.
- IPK 1.6.34 generado para prueba web/TV.
- Correccion del aviso de siguiente episodio: al cambiar de episodio se cierra y
  cancela cualquier aviso pendiente, `ar()` limpia el aviso al reiniciar el
  stream y `gn()` reinicia el estado de descarte. El aviso solo puede aparecer
  con reproduccion avanzada (`position >= 30`), duracion util (`total >= 60`) y
  fuera del periodo de guarda; `yn()` valida posicion/duracion antes de reaccionar
  a `ended`. Se agrego el log `[TUTYTV] next prompt` con posicion, total,
  restante, episodio actual y objetivo.
- IPK 1.6.35 generado para prueba web/TV.
- A5.2a: infobar VOD/live y OSD extraidos a
  `src/ui/screens/player/playerInfobar.ts`. El modulo decide que barra se
  muestra, programa/limpia el ocultado y controla los iconos de pausa/seek.
  `app.js` conserva `legacyShowInfobar`/`legacyHideInfobar` como fallback.
- A5.2b: motor de subtitulos extraido a
  `src/ui/screens/player/playerSubtitles.ts`: carga asincrona con proteccion
  contra respuestas obsoletas, busqueda de cue, render del overlay, estilos y
  duracion inferida para la barra. `app.js` mantiene la UI de pistas y el
  fallback legacy.
- IPK 1.6.36 generado para prueba web/TV.
- A5.4a: aviso de siguiente episodio extraido a
  `src/ui/screens/player/nextEpisodePrompt.ts`: visibilidad, cuenta atras,
  confirmacion/cancelacion, foco, guardas de posicion y cierre al cambiar de
  episodio. `app.js` conserva los wrappers `legacy*` y el arranque del siguiente
  episodio/`findNextPlaybackTarget`.
- IPK 1.6.37 generado para prueba web/TV.
- A5.2c: pistas de audio extraidas a `src/ui/screens/player/playerAudio.ts`:
  render de opciones, seleccion automatica frente a override manual, foco del
  track activo, persistencia y recarga del stream con el indice de audio (relay
  en la posicion actual o resolucion normal). `app.js` conserva la UI de ajustes
  y los wrappers legacy; la recarga real sigue en `Tn`/`rr`.
- IPK 1.6.38 generado para prueba web/TV.
- A5.2d: ajustes visuales de reproduccion extraidos a
  `src/ui/screens/player/playerVideoSettings.ts`: aspecto de video
  (cover/contain/16-9/4-3), sincronizacion de botones y marcas, y seleccion
  visual del modo relay/normal. `app.js` mantiene los wrappers legacy y la
  recarga real del stream.
- IPK 1.6.39 generado para prueba web/TV.
- Correccion de persistencia del modo de reproduccion por titulo: `za` ahora
  es la misma referencia que `j.playback.streamModes`, se guarda con
  `Q()`/`xuper_global_playback_v1` y se restaura al recargar. Cambiar el modo
  global limpia el mapa persistido de titulos.
- IPK 1.6.40 generado para prueba web/TV.
- A5.3: navegador de episodios extraido a
  `src/ui/screens/player/episodeBrowser.ts`: apertura/cierre, temporadas,
  listado de episodios, carga diferida, foco del episodio actual, seleccion de
  temporada y reproduccion. `app.js` conserva `legacyOpenEpisodeBrowser` y el
  arranque real `gn`.
- IPK 1.6.41 generado para prueba web/TV.
- Correccion del navegador de episodios al cambiar de temporada: al elegir un
  episodio se usa `browserSeason` (la temporada visible), no el
  `playerSeasonIndex` anterior. Se actualizan `detailSeason`,
  `playerSeasonIndex`, `seasonId` y episodios, evitando que el reproductor y el
  panel de seleccion sigan apuntando a la temporada vieja.
- IPK 1.6.42 generado para prueba web/TV.
- Correccion de la lista de temporadas al cambiar de temporada: el merge de
  detalle ya no reemplaza `seasons`/`episodes` existentes con arreglos vacios
  devueltos por la API. Esto evita que el badge de temporadas se quede sin
  opciones despues de cargar una temporada.
- IPK 1.6.43 generado para prueba web/TV.
- A5.4b: busqueda del siguiente objetivo y arranque de siguiente
  episodio/temporada extraidos a
  `src/ui/screens/player/nextEpisodeAdvance.ts`. Incluye reparacion de
  temporada preferida, carga de la siguiente temporada, merge del detalle,
  proteccion contra respuestas obsoletas y arranque del primer episodio.
  `app.js` conserva `sn`/`gn`/`ln` como host y los fallbacks legacy.
- IPK 1.6.44 generado para prueba web/TV.
- A5.1d: resolucion de reproduccion extraida a
  `src/ui/screens/player/playerResolve.ts`: seleccion de audio, construccion de
  la peticion, fallback `resolveSmooth` -> `resolve`, aplicacion de metadatos,
  posicion de reanudacion y proteccion contra respuestas obsoletas. `app.js`
  conserva `q`/`legacyApplyResolvedPlayback` y el fallback legacy; el pipeline
  de video (`rr`/`ar`) y el enrutado (`dr`/`ur`) siguen como adaptadores.
- IPK 1.6.45 generado para prueba web/TV.
- A5.1e: resolucion de canales live extraida a `playerLive.ts` (espera,
  secuencia, errores, infobar y carga del proxy) y enrutado del reproductor a
  `playerRouting.ts` (entrada VOD/live, transicion fullscreen, paneles,
  infobar y arranque). `app.js` conserva `rr`/`ar` como adaptadores de video y
  los fallbacks legacy.
- IPK 1.6.46 generado para prueba web/TV.
- A6a: ciclo de vida de la app extraido a `src/ui/runtime/lifecycle.ts`:
  suspension/reanudacion al ocultar la web, reanudacion solo si el navegador
  pauso el medio y limpieza en `beforeunload`/`unload`. `app.js` conserva los
  listeners y wrappers legacy.
- IPK 1.6.47 generado para prueba web/TV.
- A6b: deep links extraidos a `src/ui/runtime/deepLink.ts`: parseo de query,
  canal, tab, detalle, busqueda, ajustes, reproductor, panel de canales y foco.
  `app.js` mantiene el bloque legacy como fallback.
- IPK 1.6.48 generado para prueba web/TV.
- A6c: API de depuracion `window.__tuty` extraida a
  `src/ui/runtime/debugApi.ts`. `app.js` solo entrega referencias y callbacks;
  la construccion e instalacion del objeto viven en el modulo. Se elimino el
  objeto legacy duplicado.
- IPK 1.6.49 generado para prueba web/TV.
- A6d: eliminados los fallbacks legacy de infobar/OSD, pistas de audio y ajustes
  visuales de reproduccion ya validados. `app.js` llama directamente a los
  modulos extraidos para esos clusters; el resto mantiene fallback temporal.
- IPK 1.6.50 generado para prueba web/TV.
- A6e: eliminados los fallbacks legacy de subtitulos y navegador de episodios.
  La fila de seleccion de episodios de los ajustes usa
  `playEpisodeSelection(episodio, temporada)` para elegir la temporada actual
  sin depender del estado del navegador.
- IPK 1.6.51 generado para prueba web/TV.
- A6f: eliminados los fallbacks legacy de resolucion de reproduccion (`or`),
  canales live (`ur`) y enrutado del reproductor (`dr`). `app.js` delega
  directamente en `playerResolve`, `playerLive` y `playerRouting`; se actualizo
  la prueba de integracion para comprobar el host de episodios.
- IPK 1.6.52 generado para prueba web/TV.
- A6g: eliminados los fallbacks legacy del aviso de siguiente episodio y del
  avance automatico. `app.js` delega en `nextEpisodePrompt` y
  `nextEpisodeAdvance`; la prueba de integracion de navegacion de episodios se
  redujo a temporadas/`gn` y el aviso quedo cubierto por las pruebas de modulo.
- IPK 1.6.53 generado para prueba web/TV.
- Hotfix A6g: restaurada `refreshNextSeasons`, eliminada por error al limpiar el
  bloque legacy del aviso de siguiente episodio. Evita el `ReferenceError` al
  abrir la app.
- IPK 1.6.54 generado para prueba web/TV.
- A6h: eliminados los fallbacks legacy de pantalla completa y arranque de
  reproduccion. `lr`/`sr` delegan en `playerSession`; `ar` limpia la fuente del
  modulo. Se retiraron los helpers de fuente duplicados de `app.js` y se
  actualizaron las pruebas de ciclo de vida/superficie.
- IPK 1.6.55 generado para prueba web/TV.
- A6i: limpieza de codigo muerto tras las extracciones (`In`, `Ma`, `Ra`, estado
  de subtitulos y live sin uso). Se actualizaron las pruebas de historial y
  subtitulos para no depender de esos simbolos.
- IPK 1.6.56 generado para prueba web/TV.
- A6j: keepAlive/heartbeat de webOS extraido a
  `src/ui/runtime/webOsKeepAlive.ts`. `app.js` solo entrega servicio y puente
  luna; se evita duplicar intervalos al reiniciar y se toleran fallos del
  servicio.
- IPK 1.6.57 generado para prueba web/TV.
- A5.2e: contenido de la infobar del reproductor (canal live, titulo VOD,
  poster, siguiente/calidad/logo y progreso) extraido a
  `src/ui/screens/player/playerInfoContent.ts`. `app.js` conserva `fr` para el
  layout fino del live y los nodos DOM.
- IPK 1.6.58 generado para prueba web/TV.
- A5.2f: apertura/cierre del panel de canales live extraidos a
  `src/ui/screens/player/liveChannelPanel.ts`; el render de categorias/canales
  sigue en `app.js` como host (`qn`/`Rn`).
- A6k: eliminados los fallbacks legacy de visibilidad/unload ya validados; el
  ciclo de vida usa directamente el modulo.
- IPK 1.6.59 generado para prueba web/TV.
- A5.2g: contenido del panel de canales live extraido a `liveChannelPanel.ts`
  (pills de categoria con cache/foco/scroll, pagina de canales alrededor del
  actual, promo de addons, filas, navegacion y seleccion). `app.js` conserva
  solo los nodos y helpers de datos.
- IPK 1.6.60 generado para prueba web/TV.
- Ajuste addons: los HLS de listas M3U se proxifican con User-Agent/Accept
  propios (web y webOS) para evitar 403 de proveedores que rechazan al
  navegador; se agrego `referrer no-referrer` para logos/posters externos.
- IPK 1.6.61 generado para prueba web/TV.
- A6l: eliminados los fallbacks legacy de detalle (`ti`), dialogo de reanudar
  (`askResume`) y cierre del dialogo. La prueba de recordatorios ahora valida el
  boton en `detailScreen.ts`, no en el fallback de `app.js`.
- IPK 1.6.62 generado para prueba web/TV.
- A6m: eliminados los fallbacks legacy de la lista de canales (`Ht`) y del
  contenido del dialogo de addons (`$t`). Se conserva `Xt` porque el host del
  modulo lo usa para instalar listas. Pruebas de lista/addons apuntan ahora a
  los modulos.
- IPK 1.6.63 generado para prueba web/TV.
- A6n: eliminado el fallback legacy del preview de TV en Home (`Nt`/`Rt`).
  La prueba de integracion ya no simula ese fallback; el comportamiento queda
  cubierto por `previewPlayer.test.ts`.
- IPK 1.6.64 generado para prueba web/TV.
- A6o (paso grande): eliminados los fallbacks legacy de busqueda y ajustes.
  Busqueda ya usa solo `searchScreen` (teclado, resultados, filtros y remoto);
  ajustes ya usa solo `settingsScreen` (perfil, historial, reproduccion,
  parental, feedback y acerca de). Las pruebas de integracion apuntan a los
  modulos.
- IPK 1.6.65 generado para prueba web/TV.
- A6p: corregido arranque tras A6o. Se restauro `Di` (play/pause) y `_i`
  (delay del infobar), eliminados por error al limpiar ajustes; se agregaron
  wrappers de filtro hacia `searchScreen`. Se agrego `lint:legacy` con
  `no-undef` sobre `app.js` y ahora forma parte de `pnpm check`.
- IPK 1.6.66 generado para prueba web/TV.
- A6q: eliminados los fallbacks legacy de las paginas VOD de Home (1-6) y los
  constructores de bento que solo usaban esos fallbacks. Las paginas se arman
  exclusivamente con `homePages`; se conserva `Yt` porque el host del modulo lo
  usa para filtrar por categoria.
- IPK 1.6.67 generado para prueba web/TV.
- A6r: eliminado todo el fallback legacy del menu de TV en vivo (categorias,
  favoritos, busqueda de canales y teclado). Ahora depende de `liveMenu`; se
  conservan `liveUpdateLabel` y `lvFocusList` porque el host los usa.
- IPK 1.6.68 generado para prueba web/TV.
- A6s: extraida la pagina 0 de Home (TV en vivo) a `homeLivePage`: preview,
  info, flechas, lista, botones rapidos y foco. `app.js` solo asigna refs y
  dispara lista/carga de canales.
- IPK 1.6.69 generado para prueba web/TV.
- A6t: extraido el selector de categorias del panel de canales en vivo a
  `liveChannelPanel` (`openCategoryPicker`/`closeCategoryPicker`). El host
  expone overlay, grid, subtitulo, infobar y primer foco.
- IPK 1.6.70 generado para prueba web/TV.
- A6t revertido: la extraccion del selector de categorias rompio la navegacion
  hacia arriba en el panel de canales. Se restaura el comportamiento anterior
  porque esa UI sera reemplazada; se conserva el resto del avance.
- IPK 1.6.71 generado para prueba web/TV.
- A6v (limpieza legacy): eliminadas variables globales muertas de busqueda,
  ajustes y preview; helpers de sesion API, busqueda local/remota y addons ya
  reemplazados por Core/modulos; wrappers sin uso de siguiente episodio,
  lifecycle y rango de detalle. `lint:legacy` ahora tambien falla con
  `no-unused-vars`.
- IPK 1.6.72 generado para prueba web/TV.
- A6w: extraido el panel rapido de ajustes del reproductor a `playSettings`:
  apertura/cierre, temporizador, fila de episodios/rangos, refresco de filas,
  modo de reproduccion/aspecto y foco. El dialogo completo de ajustes queda
  para el siguiente paso.
- IPK 1.6.73 generado para prueba web/TV.
- A6x: extraido el dialogo completo de ajustes del reproductor a `playSettings`:
  apertura/cierre, audio, switch de subtitulos, idioma, tamano, estilo, salida
  y retorno de foco al panel rapido o al reproductor. La vinculacion de esos
  controles ya no vive en `En`.
- IPK 1.6.74 generado para prueba web/TV.
- A6y: extraida la construccion del chrome del reproductor a `playerStage`:
  seekbar, infobar, acciones, panel de canales, panel rapido, dialogo, episodios
  y referencias. `En` queda como wrapper que asigna refs.
- IPK 1.6.75 generado para prueba web/TV.
- A6z: extraido el shell de Home a `homeShell`: paginas, pestañas, iconos,
  notificaciones, accesos a buscar/filtrar/ajustes y reloj. `vt` queda como
  wrapper y `ft` se elimina de `app.js`.
- IPK 1.6.76 generado para prueba web/TV.
- A6aa: navegacion/foco sin fallback. `tt`, `at` y `nt` dependen solo de
  `focus`/`router`; se retiro el scoring manual duplicado. `focusHomeTab`,
  `it`, `Ze`, `et` se conservan porque alimentan el host de `attachFocus`.
- IPK 1.6.77 generado para prueba web/TV.
- A6ab: navegacion de teclado y atras extraida a `runtime/navigation.ts`:
  `lt`/`ot` ahora son wrappers; el modulo maneja back, overlays, cursores,
  media keys, paneles, seek/live y retorno reproductor/detalle. El host queda
  como adaptador de pantalla/reproductor.
- IPK 1.6.78 generado para prueba web/TV.
- A6ac: corregido back tras A6ab. `lt` marcaba el throttle antes de llamar a
  `handleNavigationBack`, por lo que la tecla atras se descartaba. Se agrego
  prueba de regresion para back sin overlays.
- IPK 1.6.79 generado para prueba web/TV.
- A6ad: bootstrap extraido a `runtime/bootstrap.ts`: orden de arranque,
  listeners de resize/popstate/click, keepalive, welcome, carga inicial,
  debug API y deep link. `yr` queda como wrapper y se elimina el fallback
  legacy de deep link.
- IPK 1.6.80 generado para prueba web/TV.
- A6ae: extraido el reset/limpieza de stream (`ar`) a `playerCleanup`:
  cierre de aviso, guardado de historial, aborto de relay, destruccion HLS,
  limpieza de fuente y liberacion de sesion. `legacyPlayerIntegration` ahora
  inyecta el host del modulo para probar el mismo comportamiento.
- IPK 1.6.81 generado para prueba web/TV.
- A6af: recarga de stream (`Tn`) movida a `playerCleanup`: posicion actual,
  resolucion de fuente, relay con `start`/audio y reanudacion. Queda `rr` como
  siguiente bloque del pipeline.
- IPK 1.6.82 generado para prueba web/TV.

A1 mantiene temporalmente en `app.js`:

- `Ze`, `Ye`, `et`, `it`, `focusHomeTab` (visibilidad/scroll/foco de Home);
- `nt` conserva la limpieza de overlays y `ot`/`lt` siguen en `app.js`;
- storage `G`/`J` sigue delegando directamente en Core; no se crea un wrapper
  UI duplicado.

Estas piezas se moveran en A6 junto con el bootstrap final.

## 1. Objetivo

Sacar la UI y la coordinacion restante de `app.js` sin cambiar el
comportamiento visible, la compatibilidad webOS, los datos ni el empaquetado
funcional.

Resultado esperado:

- `app.js` deja de ser un monolito y queda como bootstrap delgado.
- La UI vive en modulos TypeScript vanilla, sin framework.
- El Core sigue siendo logica pura.
- Los adaptadores webOS/DOM/reproductor quedan separados.
- La UI Glassmorphism se implementa despues, sobre una base estable.

La Fase A **no es un rediseno visual**. `style.css`, colores, tamanos y layout
se mantienen iguales durante toda la fase.

## 2. Punto de partida

| Elemento | Estado actual |
|---|---|
| `app.js` | 5.990 lineas, IIFE unico, DOM + estado + foco + reproductor |
| `style.css` | 4.303 lineas, coordenadas absolutas 1920x1080 |
| Core | 94 archivos TS, casos de uso puros |
| Plataformas | 50 archivos TS, adaptadores Web/webOS |
| Pruebas | 318 pruebas, 82 archivos |
| Tests que leen `app.js` | 31 archivos de integracion por regex |
| Core expuesto | `window.TutyCore` con 129 referencias desde `app.js` |
| Entrada HTML | `tuty-core.js` -> `app.js` |
| Canvas | 1920x1080 escalado por `mr()` |
| webOS | target `chrome53`, IIFE, sin frameworks |

### 2.1 Limites que no cambian

- No cambian IDs de app, servicio, rutas ni contratos.
- No cambian claves `xuper_local_profile_v1`, `xuper_global_playback_v1`,
  `xuper_m3u_addons`.
- No cambia el servicio Luna, la API, el relay ni el reproductor.
- No se agregan frameworks ni dependencias runtime.
- No se elimina legacy sin una extraccion verificada.
- No se toca la UI visual en Fase A.

## 3. Arquitectura objetivo

```text
src/
  core/                       logica pura, sin DOM
  platforms/
    shared/                   adaptadores compartidos
    web/                      entrada web
    webos/                    entrada webOS
  ui/
    main.ts                   inicio del runtime UI
    runtime/
      context.ts              contrato UiRuntime
      state.ts                estado de aplicacion
      dom.ts                  helpers DOM
      layout.ts               escalado 1920x1080
      router.ts               pantallas y navegacion
      focus.ts                foco, scroll y visibilidad
      service.ts              llamadas al servicio/API
      storage.ts              perfil, historial, favoritos
    screens/
      home/
        homeScreen.ts
        homeTabs.ts
        homePages.ts
        homeLive.ts
        liveCategories.ts
        liveSearch.ts
        addonsDialog.ts
      search/
        searchScreen.ts
        searchKeyboard.ts
        filterPanel.ts
      detail/
        detailScreen.ts
        resumeDialog.ts
      settings/
        settingsScreen.ts
        profilePanel.ts
        historyPanel.ts
      player/
        playerScreen.ts
        playerSession.ts
        playerInfobar.ts
        episodeBrowser.ts
        playSettings.ts
        nextEpisodePrompt.ts
        liveChannelPanel.ts
    components/
      poster.ts
      liveRow.ts
      categoryTile.ts
      focusable.ts
```

### 3.1 Artefactos runtime

Propuesta recomendada:

```text
js/tuty-core.js    generado por build:core
js/tuty-ui.js      generado por build:ui
js/app.js          bootstrap delgado, escrito a mano
```

`index.html` cargaria:

```html
<script src="js/tuty-core.js"></script>
<script src="js/tuty-ui.js"></script>
<script src="js/app.js"></script>
```

`app.js` quedaria en el orden de 200-400 lineas y solo:

- crea el runtime UI;
- conecta Core/adaptadores;
- arranca router y pantalla inicial;
- expone `window.__tuty` por compatibilidad;
- registra limpieza `beforeunload`/`visibilitychange`.

### 3.2 Por que no compilar todo dentro de `app.js`

- `app.js` es versionado y hoy es la referencia de comportamiento.
- Un artefacto separado `tuty-ui.js` permite migrar por pantallas sin convertir
  `app.js` en un archivo generado antes de tiempo.
- Mantiene el patron ya usado por `tuty-core.js`.
- Facilita rollback: si una pantalla falla, se restaura su modulo sin rehacer
  todo el bundle.

Si se prefiere un unico artefacto, la alternativa es generar `app.js` desde
`src/ui`; implica cambiar antes los tests y el flujo de build. No es la opcion
recomendada para empezar.

## 4. Inventario de `app.js`

Los rangos son orientativos y se solapan porque las funciones se llaman entre
pantallas.

| Cluster | Aprox. | Contenido | Destino |
|---|---:|---|---|
| Base y datos | 1-560 | helpers DOM, catalogo demo, API, storage, estado `j`, perfil | `ui/runtime`, `platforms` |
| Wrappers legacy | 558-1630 | funciones `legacy*` que ya delegan en Core | reducir y mover a adaptadores |
| Init y navegacion | 1604-2080 | teclado, foco, router, pantallas | `ui/runtime` |
| Home VOD | 2080-2400 | tabs, paginas, hero, bento, cards | `ui/screens/home` |
| Live | 2409-3200 | preview, lista, categorias, busqueda, addons | `ui/screens/home` |
| Home builder | 3202-3310 | bento/cards/rows | `ui/screens/home` |
| Detalle y resume | 3286-3672 | detalle, historial, reanudacion | `ui/screens/detail` |
| Busqueda/filtros | 3672-3993 | teclado, resultados, filtros | `ui/screens/search` |
| Ajustes | 3969-4234 | perfil, historial, ajustes globales | `ui/screens/settings` |
| Reproductor | 4234-5870 | sesion, infobars, episodios, subtitulos, siguiente | `ui/screens/player` |
| Bootstrap/escalado | 5871-5990 | init, resize, `__tuty`, limpieza | `app.js` |

### 4.1 Dependencias transversales

- `j`: estado global de pantalla, reproductor, foco y overlays.
- `X`: perfil, historial, favoritos y recordatorios.
- `l`: catalogo VOD.
- `F`: canales live.
- `q`: servicio/API.
- `tt`: foco.
- `at`: navegacion direccional.
- `nt`/`ot`: cambio y retroceso de pantalla.
- `e/t/i/a/n`: helpers DOM.
- `mr`: escalado 1920x1080.
- `window.__tuty`: API de depuracion/automatizacion.

No se puede extraer una pantalla sin resolver estas dependencias. La primera
extraccion debe ser el runtime compartido, no una pantalla aislada.

## 5. Estrategia de migracion

Usar un patron strangler controlado:

1. Mantener `app.js` funcionando en todo momento.
2. Mover un cluster a `src/ui`.
3. Compilar `tuty-ui.js`.
4. Hacer que `app.js` delegue en el modulo extraido.
5. Conservar el codigo legacy como fallback hasta validar.
6. Eliminar el fallback en un commit separado y trazable.
7. Repetir.

Reglas:

- Una extraccion por etapa/commit.
- No mezclar extraccion con rediseno visual.
- No renombrar funciones en el mismo commit que las mueve.
- No cambiar comportamiento, textos, IDs ni clases funcionales.
- No duplicar logica: el modulo extraido es la unica implementacion activa.
- Los fallbacks son temporales y deben quedar listados.
- Cada etapa debe pasar `pnpm check` y builds.
- La validacion final de cada hito es en TV real.

## 6. Etapas

### A0 - Baseline y contrato

Objetivo: congelar comportamiento y preparar el terreno.

- Etiquetar/registrar baseline 1.6.17.
- Crear `src/ui` con `main.ts`, `context.ts` y tipos.
- Crear `vite.ui.config.ts` (IIFE, `chrome53`, `tuty-ui.js`).
- Agregar `build:ui` y encadenarlo a `build:ipk`/`build:web`.
- Servir `tuty-ui.js` en desarrollo.
- Mantener `app.js` sin cambios funcionales.
- Documentar orden de scripts y rollback.

Salida:

- `tuty-ui.js` vacio o solo con runtime base.
- App igual.
- `pnpm check`, build web, build webOS e IPK OK.

### A1 - Runtime compartido

Objetivo: mover la base que todas las pantallas necesitan.

- `state.ts`: `j`, perfil `X`, catalogos `l/F`, claves de storage.
- `dom.ts`: `e`, `t`, `i`, `a`, `n`.
- `layout.ts`: `mr`.
- `focus.ts`: `tt`, `at`, `Ze`, `et`, `Ye`, `it`, `focusHomeTab`.
- `router.ts`: `nt`, `ot`, `st`, `lt` y registro de teclado.
- `service.ts`: `q`, `L`, `C`.
- `storage.ts`: `G`, `J`, perfil y persistencia.

Transicion:

- `app.js` crea el runtime y aliasa `j`, helpers y funciones a `window.TutyUI`.
- Las pantallas siguen en `app.js`.
- El estado es el mismo objeto, no una copia.

Salida:

- Navegacion, foco, cambio de pantalla y storage iguales.
- Sin pantallas movidas aun.
- TV: navegacion basica y salida.

### A2 - Home y TV en vivo

Objetivo: sacar el cluster mas grande y autocontenido.

- Home tabs, paginas, hero, bento, cards y rows.
- Preview live, lista de canales, zapping, favoritos.
- Categorias live, busqueda live y dialogo de addons.
- Filtro de Home y busqueda local de Home si aplica.

Salida:

- Home y live funcionando desde `src/ui`.
- `app.js` delega y conserva fallback temporal.
- TV: tabs, live, categorias, busqueda, addons, favoritos.
- Preview/carga HLS se evaluan en A5.1 por su acoplamiento al reproductor.

### A3 - Busqueda y ajustes

- Pantalla de busqueda, teclado, resultados y paginacion.
- Panel de filtros.
- Ajustes, perfil, historial, favoritos y recordatorios.
- Apertura de historial.

Salida:

- Busqueda y ajustes fuera de `app.js`.
- TV: buscar, filtrar, abrir historial, cambiar ajustes.

### A4 - Detalle

- Pantalla de detalle, sinopsis, temporadas/episodios.
- Dialogo de reanudar.
- Apertura desde Home, busqueda e historial.

Salida:

- Detalle fuera de `app.js`.
- TV: abrir ficha, reanudar, elegir episodio.

### A5 - Reproductor

Dividir por riesgo:

- A5.1: sesion de reproduccion, resolucion, relay, HLS.
- A5.2: infobars VOD/live, OSD, subtiulos, pistas.
- A5.3: navegador de episodios y ajustes de reproduccion.
- A5.4: aviso de siguiente episodio/temporada y avance.

Salida:

- Reproductor fuera de `app.js`.
- TV: VOD, live, pausa, seek, audio, subtitulos, episodios, siguiente.

### A6 - Bootstrap final

- `app.js` solo crea runtime, arranca `src/ui/main.ts` y expone `__tuty`.
- Eliminar wrappers/fallbacks legacy ya sin uso.
- Migrar los 31 tests que leen `app.js` por regex a tests de modulo.
- Actualizar documentacion y build.

Salida:

- `app.js` objetivo: menos de 400 lineas.
- Sin creacion de DOM de pantallas en `app.js`.
- Sin logica de negocio nueva en `app.js`.
- Sin fallbacks duplicados.

### A7 - Cierre de Fase A

- `pnpm check`.
- `pnpm build:web`.
- `pnpm build:webos`.
- `pnpm build:ipk`.
- Instalacion y prueba fisica en TV.
- Checklist funcional completo.
- Tag de cierre.
- Recien entonces habilitar la implementacion UI.

## 7. Contrato UiRuntime

Borrador a validar en A0:

```ts
interface UiRuntime {
  state: AppState;
  profile: ViewerProfile;
  catalog: MediaItem[];
  liveChannels: LiveChannel[];
  core: TutyCoreLike | null;
  service: (method: string, params: unknown, done: ServiceCallback) => void;
  dom: {
    byId(id: string): HTMLElement | null;
    el(tag: string, className?: string, text?: string): HTMLElement;
    clear(node: Element): void;
    place(node: HTMLElement, x: number, y: number, w?: number, h?: number): HTMLElement;
  };
  focus(element: Focusable | null, silent?: boolean): void;
  move(direction: "left" | "right" | "up" | "down"): void;
  showScreen(name: ScreenName): void;
  back(): void;
  toast(message: string): void;
  openDetail(item: MediaItem): void;
  openPlayer(mode: "live" | "vod", item?: MediaItem | null): void;
}
```

Reglas del contrato:

- Sin acceso a variables globales sueltas desde pantallas.
- Sin `document.getElementById` directo fuera de `dom`.
- Sin `localStorage` directo fuera de `storage`.
- Sin `webOS.service` directo fuera de adaptadores.
- Sin logica de negocio nueva en UI; se delega en Core.

## 8. Compatibilidad webOS

Cada etapa debe cumplir:

- Bundle `chrome53`, IIFE, `inlineDynamicImports`.
- Sin CSS Grid, `gap`, `aspect-ratio` ni `:focus-visible` obligatorio.
- Sin `backdrop-filter` obligatorio.
- Sin dependencias runtime.
- Sin `fetch` nuevo donde ya se use XHR compatible.
- Sin cambios de orden de scripts sin actualizar el plugin de desarrollo.
- Sin `window.__tuty` roto.
- Sin cambios de teclado/foco.

## 9. Pruebas y validacion

### Automaticas

- Mantener 318 pruebas como linea base.
- Cada modulo extraido debe tener pruebas propias.
- Migrar tests regex de `app.js` a pruebas del modulo correspondiente.
- Agregar pruebas para estado, router, foco, servicio y storage.
- No agregar jsdom/happy-dom sin justificacion; preferir funciones puras y
  harness existente.

### Manuales en TV

- Inicio, welcome y Home.
- Tabs Home y scroll.
- TV live: preview, zapping, categorias, busqueda, favoritos, addons.
- Busqueda VOD, filtros y resultados.
- Detalle, reanudar, historial, temporadas/episodios.
- VOD: play, pausa, seek, audio, subtitulos, fin de episodio.
- Live player: infobar, canales, categorias.
- Ajustes y persistencia tras reinicio.
- Control remoto en todas las direcciones y BACK/MENU.

### Build

Cada hito:

```bash
pnpm check
pnpm build:web
pnpm build:webos
pnpm build:ipk <version>
```

Instalar IPK y validar en TV.

## 10. Riesgos

| Riesgo | Mitigacion |
|---|---|
| Estado duplicado entre `app.js` y UI | Un solo objeto de estado; alias, no copia |
| Regresion de foco direccional | Extraer foco primero y probar TV por pantalla |
| Tests regex fragiles | Migrarlos junto con cada modulo |
| `tuty-ui.js` no se empaqueta | Encadenar build:ui y validar IPK |
| Chrome 53 rompe sintaxis | Mismo target y prueba webOS por hito |
| Pantalla extraida usa variables ocultas | Contrato UiRuntime y lint de imports |
| Player con carreras de eventos | Extraer al final y en subetapas |
| Perdida de datos | No tocar claves/formato; pruebas de storage |
| `__tuty` deja de funcionar | Mantenerlo en bootstrap y probar |
| Dos implementaciones activas | Fallback solo de transicion; eliminar con trazabilidad |

## 11. Criterio de cierre de Fase A

- `app.js` menor a 400 lineas.
- Ninguna pantalla se construye en `app.js`.
- Ningun flujo de negocio se decide en `app.js`.
- UI modular en `src/ui`, sin framework.
- Core sin DOM.
- Adaptadores sin logica de pantalla.
- 31 tests de `app.js` migrados.
- `pnpm check` verde.
- Builds web/core/webOS/IPK verdes.
- Prueba fisica webOS completa.
- Sin cambios visuales.
- Sin cambios de IDs, claves, API, servicio ni datos.

## 12. Decisiones requeridas antes de A0

1. Aprobar el artefacto `tuty-ui.js` + `app.js` bootstrap.
2. Aprobar el cambio de build para generar y empaquetar `tuty-ui.js`.
3. Aprobar que Fase A no cambia la UI visual.
4. Autorizar la primera extraccion: A0 + A1 (runtime compartido).
