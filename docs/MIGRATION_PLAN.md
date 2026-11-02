# TutyTV - Plan de Migracion Incremental

Fecha: 2026-11-01

## Estado de partida

- app funcional actual webOS + web local en `source/`
- nuevo baseline modular creado en `src/` con TypeScript, Vite, Vitest y ESLint
- build IPK actual preservado y validado
- gestion de dependencias migrada de npm a pnpm (`pnpm-lock.yaml`)
- marca visible renombrada a TutyTV conservando IDs tecnicos y datos guardados

## Prioridad actual: primero web

La migracion, integracion y validacion funcional se realizan primero en la app
web con `pnpm dev` y `pnpm build:web`. El objetivo es probar navegacion, API,
persistencia, catalogo y reproduccion en navegador antes de adaptar y validar
en TV. La compatibilidad webOS, el empaquetado y la prueba fisica se retoman
como ultima etapa; se preservan los IDs y el flujo webOS existente.

## Fase 0 - Auditoria (completada)

Entregable:

- `docs/ARCHITECTURE_AUDIT.md`

Validado:

- inventario tecnologico
- entradas web/webOS
- dependencias de servicio
- build y validacion IPK
- compatibilidad webOS/Chromium

## Fase 1 - Infraestructura paralela (completada)

Entregables:

- `package.json`
- `pnpm-lock.yaml`, `pnpm-workspace.yaml`
- `tsconfig.base.json`, `tsconfig.json`
- `vite.web.config.ts`, `vite.webos.config.ts`
- `vitest.config.ts`
- `eslint.config.mjs`
- estructura `src/core` y `src/platforms`

Validaciones ejecutadas:

- `pnpm run lint` -> OK
- `pnpm run typecheck` -> OK
- `pnpm run test` -> OK (15 pruebas)
- `pnpm run build:web` -> OK
- `pnpm run build:webos` -> OK
- `pnpm run build:ipk` -> OK (con warnings de locale en `bsdtar`, sin fallo)
- IPK verificada: `appinfo` con `title: TutyTV`, IDs intactos, app y servicio presentes

Nota de entorno:

- Rollup 4.67 usa AVX2 y falla con `SIGILL` en este CPU (Ivy Bridge).
  Se fija `rollup@4.45.1` en `pnpm-workspace.yaml`; no quitar sin revalidar.

## Fase 2 - Extraccion Core (completada)

Objetivo:

- extraer funciones puras desde `source/usr/palm/applications/.../js/app.js` a `src/core`

Extraido y probado:

1. `normalizeText` (minusculas, NFD, acentos) a partir de `o()` en `app.js`
2. `filterMatches` (`cat:`/`gen:`/`*`) con paridad funcional
3. `filterCatalogByQuery` reutilizando la normalizacion compartida
4. `liveFavKey`, `isLiveFavorite`, `toggleLiveFavorite`
5. `findHistoryEntry`, `episodeIdExists`

Criterio aplicado:

- el monolito legacy sigue intacto; el Core se desarrollo en paralelo
- pruebas unitarias por cada extraccion

## Fase 3 - Contratos y adaptadores (en curso)

Objetivo:

- separar infraestructura de plataforma con contratos estables

Completado:

- `StorageAdapter` + `KeyValueStore`
- `createJsonStorageAdapter` (serializacion JSON con fallback a `null`)
- implementaciones `createWebStorageAdapter` y `createWebOsStorageAdapter`
- pruebas del adaptador con almacenamiento en memoria
- `PlayerAdapter` HTML5/HLS con loader inyectable (`createHtml5PlayerAdapter`)
- `NavigationAdapter` teclado/control remoto (`createNavigationAdapter`)
- `PlatformAdapter` de capacidades runtime (`createPlatformAdapter`)
- pruebas de los tres adaptadores con dobles en memoria
- `G` y `J` delegan en el adaptador JSON mediante el puente Core, con fallback
  legacy; se conservan las claves, el JSON `null` y el manejo de errores
- pruebas de integracion de los wrappers con y sin el puente
- el mapeo legacy de navegacion delega en el adaptador para volver, mover el
  foco y activar; se conserva el listener y los casos especiales existentes
- la regla de seleccion HLS segun el navegador TV delega en plataforma; la pausa
  de video en rutas seleccionadas delega en el adaptador HTML5
- ambos puntos conservan fallback y pruebas de integracion con el runtime legacy
- las operaciones de fuente, carga, HLS externo, inicio, pausa y seek del
  reproductor y la previsualizacion delegan en el adaptador HTML5 con fallback
- pruebas de integracion de HLS nativo/HLS.js, reintentos, reanudacion, relay,
  parada y previsualizacion con y sin el puente
- limites de seek para reproduccion local y relay extraidos a Core
- recuperacion de errores HLS extraida al adaptador compartido, conservando
  los reintentos y el tratamiento de errores fatales y no fatales
- seleccion de reintentos nativos y construccion del historial de reproduccion
  extraidas a Core con fallback y pruebas del runtime; se conservan el limite
  de 30 entradas, el intervalo de guardado y la proteccion contra retries obsoletos
- destruccion de HLS y programacion de reintentos condicionados compartidas
- registro de teclas y puntuacion del foco direccional integrados en navegacion,
  conservando el listener legacy de teclas multimedia y retorno en `keyup`
- disponibilidad Luna, capacidad HLS de preview y salida de plataforma integradas
  con fallback y pruebas de servicio Luna y servidor web
- los addons M3U ya no acceden a `localStorage` directamente; usan `G`/`J` con
  fallback, conservando el alta por defecto y el reseteo ante JSON invalido o lista vacia
- las decisiones de modo relay, relay forzado y arranque reanudado via relay se
  extrajeron a Core y se integraron con fallback
- las reglas de visibilidad del foco (paneles, busqueda, home y player) se
  extrajeron a Core; `Ye` conserva las comprobaciones geometricas y el fallback
- la restauracion de preferencias de reproduccion y la inicializacion del perfil
  (id, historial y reparacion) se extrajeron a Core con fallback
- el dialogo Ajuste de reproducir ahora persiste idioma de audio, subtitulos,
  tamano y estilo mediante `Q()`, conservando el codigo de pista exacto
  (`audioCode`/`subCode`) y la preferencia es/pt/en como respaldo
- la construccion de la URL del servicio de desarrollo y su query string se
  extrajo a Core; el transporte Luna y el fallback de servicio siguen en `q`
- el mapeo de teclas multimedia (play, pause, stop, avance, retroceso y menu)
  se extrajo a Core y `lt` conserva toda la logica de pantalla y foco
- el formato y parseo de duraciones, la resolucion de duracion con fallback y
  el calculo porcentual de la barra de seek se extrajeron a Core; `Ei` conserva
  la lectura del buffer
- en modo relay/smooth el total visible ahora usa la duracion absoluta de
  episodio/pelicula (o `zn + we.duration`); `Zn` aplica la misma prioridad
- la barra conserva la posicion seleccionada durante buffer/carga
  (`seeking`, `seeked`, `waiting`, `stalled`, `progress`)
- la barra enfocada avanza/retrocede 10 s por pulsacion, igual que los botones
  izquierda/derecha, y muestra el icono de interaccion
- la barra enfocada solicita el seek automaticamente (sin OK final); OK solo
  sale del modo de ajuste
- para series sin duracion en el portal se infiere la duracion de episodios
  hermanos; en relay web y webOS se consulta `/duration/<token>` al ffmpeg, que
  reporta la duracion real de la fuente
- TV en vivo: filtrado de canales visibles por favoritos, conservando los
  indices originales, busqueda de canales/categorias y deduplicacion por
  `channelCode` al paginar extraidos a Core; `Ht`, `lvRenderResults` y `Bt`
  usan wrappers con fallback legacy
- normalizacion de categorias del portal con fallback, categoria de Addons M3U,
  validacion HTTP(S), deteccion de URL instalada, alta/actualizacion y
  eliminacion de addons extraidas a Core; `Bt`, `Xt`, `$t` y la validacion de
  URL usan wrappers con fallback legacy
- etiqueta/estado de la categoria activa y scroll de la lista de canales
  extraidos a Core; `liveUpdateLabel` y `zt` usan wrappers con fallback
- busqueda de TV en vivo unificada: categorias visibles desde el inicio y
  seleccion de categoria sin cerrar el dialogo; al cambiar de categoria se
  recargan sus canales y se conserva la busqueda abierta

Pendiente:

- migrar progresivamente la coordinacion restante de eventos, relay, historial
  y estado de reproduccion que aun reside en `app.js`
- migrar progresivamente las reglas de visibilidad y los focos especificos de UI
- completar la coordinacion restante de live TV (carga y foco) y la UI de
  addons

## Fase 4 - Integracion progresiva UI actual (primer corte completado)

Objetivo:

- integrar Core sin redisenar interfaz

Completado:

- `vite.core.config.ts` compila `src/platforms/webos/legacyCoreBridge.ts` como
  IIFE `chrome53` en `source/.../js/tuty-core.js` (`window.TutyCore`)
- `index.html` carga el puente antes de `app.js`
- `app.js` delega en `window.TutyCore` para `filterMatches`, `liveFavKey`,
  `liveIsFav`, `liveToggleFav`, `findHistory` y `episodeIdExists`
- cada punto conserva la implementacion legacy como fallback si el artefacto
  no esta disponible
- `build:ipk` ejecuta `build:core` antes de empaquetar; el IPK incluye
  `js/tuty-core.js` con hash identico al generado

Estrategia:

- mantener HTML/CSS actual
- introducir imports modulares en puntos controlados
- activar por feature flags internas si es necesario

## Fase 4b - Flujo pnpm dev/start (completado)

Objetivo:

- pnpm como punto de entrada unico; Vite para desarrollo/HMR y Node para APIs

Completado:

- `pnpm dev` sirve la app real con Vite, API Node como middleware y HMR de
  CSS/Core; los cambios en `js/app.js` provocan recarga completa
- `server.js` exporta `API_METHODS`, `handleApi`, `createHandler`,
  `createServer` y `startServer`; acepta `--port`, `--host`, `--app-dir` y
  `--no-open` sin efectos al requerirlo como modulo
- `pnpm build:web` compila el Core y prepara `dist/web`; `pnpm start:web`
  sirve `dist/web` con la API y sin abrir navegador
- `pnpm start` conserva el modo legacy desde `source/`
- `pnpm check` agrupa lint, typecheck y tests
- README raiz documenta comandos, HMR, variables y el reparto Vite/Node

## Fase 5 - Completar y validar la version web (completada 2026-11-02)

Objetivo:

- separar el desarrollo y el build web de los artefactos de webOS
- continuar la migracion de los flujos de UI, API, navegacion y reproduccion web
- comprobar en navegador la paridad entre desarrollo y produccion

Condiciones de salida:

- lint, typecheck, pruebas y build web correctos
- navegacion, catalogo, favoritos, historial y reproduccion comprobados en web
- smoke tests de API y recursos en desarrollo y produccion
- validacion visual en navegador, incluyendo recarga y persistencia

Estado: completada para web. El usuario confirmo los flujos corregidos de
historial, busqueda, preview->pantalla completa y catalogos. `pnpm check`
pasa con 226 pruebas; builds web/core/webOS e IPK 1.6.6 validado
estructuralmente. La instalacion y prueba en TV fisica quedan en Fase 6.

## Fase 6 - Adaptacion y validacion webOS (ultima etapa)

Objetivo:

- adaptar los resultados web al runtime, control remoto y servicio webOS
- validar compatibilidad del bundle, rutas, empaquetado IPK y funcionamiento en TV

Condicion de salida:

- builds e IPK validados
- prueba en TV fisica de navegacion, persistencia y reproduccion
- retirar duplicaciones legacy solo cuando no tengan dependencias activas

Estado: completada (2026-11-02). La IPK 1.6.7 fue instalada y validada en TV
fisica: navegacion/control remoto, catalogo, carga de titulos, busqueda,
guardado de configuracion y transicion episodio->temporada->episodio OK. La
limpieza de duplicaciones legacy queda como mantenimiento no bloqueante.

## Checklist de la etapa web

1. `pnpm run lint`
2. `pnpm run typecheck`
3. `pnpm run test`
4. `pnpm run build:web`
5. Smoke tests de `pnpm dev` y `pnpm start:web`
6. Prueba visual y funcional en navegador

Al terminar la etapa web: `pnpm run build:webos`, `pnpm run build:ipk`,
verificacion estructural del IPK y prueba en TV fisica.

## Registro de esta iteracion (2026-11-01)

1. pnpm adoptado; `package-lock.json` y `node_modules` de npm eliminados.
2. `allowBuilds: esbuild` y override `rollup@4.45.1` en `pnpm-workspace.yaml`.
3. Renombrado visible a TutyTV en app, servicio, launchers, instaladores y docs.
4. Globals internos renombrados de forma consistente (`TUTYTV_API`, `TUTYTV_WEB`,
   `TUTYTV_CATALOG`, `TUTYTV_PORTAL`, `__tutyHls`, etc.).
5. Core ampliado: normalizacion, filtros, favoritos e historial con pruebas.
6. Adaptador JSON de almacenamiento + implementaciones Web y webOS.
7. Detectada y corregida la frontera CommonJS: `source/package.json` evita que
   Node 24 interprete `source/web/server.js` como ESM.
8. Smoke test del servidor web: `/`, `/js/app.js` y `/config/api.js` responden
   200 e inyectan `TUTYTV_WEB`, `TUTYTV_WEB_BUILD` y `TUTYTV_API`.
9. Puente Core -> legacy: `tuty-core.js` IIFE cargado antes de `app.js`, con
   delegacion en `window.TutyCore` y fallback legacy. Validado en `vm` y
   presente en el IPK con hash identico al generado.
10. Smoke test web ampliado: `/js/tuty-core.js` responde 200 y el HTML servido
    mantiene el orden `tuty-core.js` -> scripts inyectados -> `app.js`.
11. Adaptadores de plataforma, navegacion y reproductor HTML5/HLS con pruebas
   por dobles; aun no cableados al monolito.
12. Validado: lint, typecheck, 25 tests, build core, build web, build webOS,
   IPK con integridad correcta.
13. Nuevo flujo pnpm: `pnpm dev` con Vite + API Node como middleware + HMR de
   CSS/Core; `pnpm build:web` prepara `dist/web` y `pnpm start:web` lo sirve.
14. `server.js` refactorizado a modulo reutilizable (`API_METHODS`,
   `handleApi`, `startServer`) con CLI `--port`, `--host`, `--app-dir` y
   `--no-open`, conservando todas las rutas y funcionalidades.
15. Smoke tests: dev en 8910 y produccion en 8914 responden `/`, `/js/app.js`,
   `/js/tuty-core.js`, `/hls.min.js`, `/css/style.css` y `/ping`; el HTML dev
   carga HMR, core en modulo y `app.js` como modulo.
16. README raiz reescrito con requisitos, comandos, HMR, variables y auditoria
   Vite/Node; `source/README.md` apunta al flujo pnpm.
17. No se realizo instalacion fisica en TV; no se afirma prueba en hardware.
18. Almacenamiento conectado mediante `G`/`J` al adaptador JSON para perfil,
    favoritos, historial y otras preferencias; conserva fallback legacy.
19. Verificados lint, typecheck, 33 pruebas, build web, build webOS e IPK
    temporal validado estructuralmente.
20. Integracion parcial de adaptadores: mapeo del control remoto, regla HLS
    para navegadores TV y pausa del reproductor, con fallback legacy.
21. Verificados lint, typecheck, 37 pruebas, builds web y webOS, puente IIFE e
    IPK temporal validado; el puente empaquetado coincide con el generado.
22. Operaciones de video del reproductor y preview conectadas al adaptador HTML5,
    preservando promesas, excepciones sincronas y orden de HLS.js.
23. Verificados lint, typecheck, 52 pruebas, builds web y webOS, puente IIFE e
    IPK temporal validado; el puente empaquetado coincide con el generado.
24. Extraidos los limites de seek local/relay y la recuperacion de errores HLS,
    con pruebas de paridad del runtime con y sin puente.
25. Verificados lint, typecheck, 60 pruebas, builds web y webOS, puente IIFE e
    IPK temporal validado; el puente empaquetado coincide con el generado.
26. Extraidas las reglas de seleccion de reintentos nativos y de construccion
    del historial; conservados la temporizacion y los guardas del runtime.
27. Verificados lint, typecheck, 70 pruebas, builds web y webOS, puente IIFE e
    IPK temporal validado; el puente empaquetado coincide con el generado.
28. Integrados la limpieza HLS y los reintentos condicionados; navegacion del
    teclado/foco y capacidades de plataforma conectadas al runtime legacy.
29. Verificados lint, typecheck, 82 pruebas, builds web y webOS, puente IIFE,
    smoke test Vite e IPK temporal validado con puente de hash identico.
30. Prioridad acordada: terminar y validar primero la web; webOS y TV quedan
    para la ultima etapa.
31. Puente compartido separado de webOS y build web independiente en
    `dist/web`; verificados lint, typecheck, 84 pruebas y smoke tests web de
    desarrollo y produccion. La validacion visual en navegador sigue pendiente.
32. Addons M3U enrutados por `G`/`J` y reglas de relay/reanudacion extraidas a
    Core. Verificados lint, typecheck y 91 pruebas; el usuario confirmo que
    `pnpm dev` abre correctamente en el navegador.
33. Reglas de visibilidad del foco extraidas a Core con pruebas y fallback.
    Verificados lint, typecheck, 105 pruebas y build web de produccion.
34. Restauracion de preferencias de reproduccion e inicializacion del perfil
    (id, historial, favoritos y recordatorios) extraidas a Core con fallback.
    Verificados lint, typecheck y 116 pruebas; build y smoke tests web OK.
35. Corregida la persistencia del dialogo Ajuste de reproducir: audio,
    subtitulos, tamano y estilo ahora se guardan y restauran por codigo de pista
    con respaldo es/pt/en. Verificados lint, typecheck y 122 pruebas.
36. URL del servicio de desarrollo y mapeo de teclas multimedia extraidos a
    Core con fallback. Verificados lint, typecheck y 128 pruebas.
37. Duraciones, fallback de duracion y porcentajes de seek extraidos a Core.
    Verificados lint, typecheck y 136 pruebas.
38. Corregido el total/progreso en relay/smooth: usa duracion absoluta de
    episodio/pelicula y `zn + we.duration`. Verificados lint, typecheck y
    138 pruebas.
39. Barra sincronizada durante buffer/carga y paso de 10 s en la barra enfocada;
    se ignoran duraciones candidatas menores que la posicion actual.
    Verificados lint, typecheck y 140 pruebas.
40. La barra enfocada adelanta automaticamente sin OK; series sin duracion usan
    inferencia de hermanos y sonda ffmpeg `/duration/<token>` en relay web.
    Verificados lint, typecheck y 144 pruebas.
41. Con la barra enfocada el tiempo sigue avanzando; solo se muestra la posicion
    de vista previa mientras hay un seek pendiente. Verificados lint, typecheck
    y 144 pruebas.
42. Parseo de subtitulos SRT/WebVTT y timestamps extraido a Core; `Ra`/`Ua`
    conservan fallback y el filtrado de etiquetas `<font>`. Verificados lint,
    typecheck y 149 pruebas.
43. Titulos y duraciones de episodios extraidos a Core; `dn`/`cn` conservan
    fallback y el formato de la UI. Verificados lint, typecheck y 153 pruebas.
44. Seleccion del subtitulo activo extraida a Core; `Ba` conserva el fallback y
    el render del texto. Verificados lint, typecheck y 154 pruebas.
45. Temporadas, episodios de la temporada e indice del episodio actual extraidos
    a Core; `sn`/`yn` conservan fallback y la carga de la siguiente temporada.
    Verificados lint, typecheck y 159 pruebas.
46. Corregido el salto de fin de temporada: la API entrega las temporadas fuera
    de orden, asi que ya no se usa `indice + 1`; se elige la de numero
    inmediatamente superior y se actualiza el indice real. Verificados lint,
    typecheck y 161 pruebas.
47. El salto automatico de temporada ahora fusiona la metadata de la nueva
    temporada (titulo, poster, etc.), conserva las temporadas ordenadas, marca
    el detalle para reconstruccion y actualiza el infobar. Verificados lint,
    typecheck y 162 pruebas.
48. Historial con `seriesId`/`seasonId` estables: deduplica por serie,
    reconstruye el episodio desde el historial y recarga la temporada guardada
    al reabrir el titulo. Verificados lint, typecheck y 166 pruebas.
49. Ajuste de scroll del foco extraido a Core con escala 1:1 de respaldo y
    margen legacy de 12 px; `et` conserva el recorrido de contenedores.
    Verificados lint, typecheck y 172 pruebas.
50. Foco/UI: las cards grandes bajan a las pequenas de su misma seccion, el
    bento pagina de 6 en 6 (18 por seccion mas fila "Mas") y Explorar agrega
    filas de Peliculas, Series, Anime, Infantil y Gratis con scroll vertical.
51. Foco/UI: se quito la fila vacia de Netflix, izquierda desde la primera
    columna vuelve al menu, se recuerda el ultimo foco por panel y KIDS tiene
    orden explicito grande -> pequenas -> posters. Verificados lint,
    typecheck y 174 pruebas.
52. Corregido un TypeError del bento que rompia la navegacion: los parametros
    `e`/`a` de `Kt` ocultaban el helper de elementos y el de posicionamiento;
    se renombraron a `pageEl`/`list`. Verificados lint, typecheck y 174 pruebas.
53. Se retiraron los overrides agresivos de navegacion: el movimiento normal
    vuelve al algoritmo geometrico; solo quedan menu desde la primera columna y
    paginado desde la ultima card pequena. KIDS vuelve a su navegacion base.
54. Corregido `tabFocus is not defined` (rompia `tt` en cada movimiento) y
    ajustado el score para preferir la fila mas cercana. Validado con Chromium
    headless: grande -> pequenas -> posters, paginado, menu, memoria de foco,
    KIDS y scroll de Explorar. Verificados lint, typecheck y 175 pruebas.
55. Se elimino el paginado manual del bento: una card grande rota 4 titulos
    cada 5 s sin intervencion del usuario; se quitaron dots/pista y el resto
    de cards queda estatico. Validado con Chromium headless y 175 pruebas.
56. Layout final: dos cards grandes (solo la izquierda rota) + cuatro pequenas
    + fila "Mas"; KIDS y Explorar usan el mismo componente. La rotacion
    incorpora crossfade de 0.55 s. Validado con Chromium headless y 175 pruebas.
57. Normalizacion del catalogo desde payloads del portal extraida a Core:
    extraccion de items anidados, deteccion de series, parseo de
    temporada/titulo, resolucion de imagenes y normalizacion de metadatos.
    `g`/`S`/`k`/`_` conservan fallback legacy. Verificados lint, typecheck,
    182 pruebas, builds web/core/webOS y carga del panel Peliculas en Chromium
    headless sin errores de pagina.
58. Agrupacion de temporadas y mezcla de raices del portal extraidas a Core:
    series ordenadas por numero, titulo de grupo, union de categorias y mezcla
    de duplicados mas catalogo local con `streamUrl`. `M`/`O` conservan
    fallback legacy. Verificados lint, typecheck, 189 pruebas, builds
    web/core/webOS y paneles Peliculas/Series en Chromium headless sin errores.
59. Busqueda local por titulo/alias y combinacion con resultados del portal
    extraidas a Core; `ui` conserva el debounce, la secuencia, el modo portal y
    el fallback legacy. Verificados lint, typecheck, 194 pruebas, builds
    web/core/webOS y busquedas "Drama"/"Halloween" en Chromium headless sin
    errores.
60. Decisiones del ciclo de reproduccion extraidas a Core: posicion absoluta
    relay, duracion total, descriptor HLS/MP4 y eleccion de HLS.js. Los eventos
    del reproductor usan `legacyCurrentPlaybackPosition`,
    `legacyResolvePlaybackTotal`, `legacyDescribePlaybackStream` y
    `legacyShouldUseHls` con fallback legacy. Verificados lint, typecheck,
    200 pruebas, builds web/core/webOS y apertura del reproductor en Chromium
    headless sin errores.
61. Reglas de ciclo de vida del reproductor extraidas a Core: guardado de
    historial antes del reset, base del aborto local, carga previa de episodios
    de series y reutilizacion de la sesion de detalle. `ar`, `or` y `lr` usan
    wrappers con fallback legacy. Verificados lint, typecheck, 207 pruebas,
    builds web/core/webOS y apertura del reproductor sin errores de JavaScript.
62. Temporizacion del reproductor extraida a Core: aviso de buffer, debounce de
    seek, heartbeat de historial, reset de seek relay y retardo de resolucion
    live. `Xn`, `Kn`, `Oi`, `ur` y `onplay` usan `legacyPlaybackTiming` y sus
    guardas con fallback legacy. Verificados lint, typecheck, 213 pruebas,
    builds web/core/webOS y apertura del reproductor sin errores de pagina.
63. Cableado de eventos del reproductor extraido a Core: 15 eventos del video y
    los eventos ERROR/MANIFEST_PARSED de HLS se registran mediante
    `wirePlaybackVideoEvents`/`wireHlsPlaybackEvents`. `rr` usa wrappers con
    fallback legacy. Verificados lint, typecheck, 218 pruebas, builds
    web/core/webOS y apertura del reproductor sin errores de pagina.
64. Superficies y transiciones del reproductor extraidas a Core: video activo,
    poster visible, texto/estado del reproductor, modo VOD y transicion
    detalle-reproductor. `rr`, `nr`, `lr`, `dr` y las salidas usan wrappers con
    fallback legacy. Verificados lint, typecheck, 224 pruebas y builds
    web/core/webOS.
65. Corregido el cruce de catalogos e historial: `qa` ya no usa el respaldo
    global `Ea`, por lo que un titulo sin historial abre su propio detalle
    aunque antes se haya abierto una serie del historial. La transicion
    preview->pantalla completa detecta sesiones HLS con blob o URL de relay y
    conserva la posicion actual antes de reiniciar. Regresion validada en
    Chromium: serie del historial -> buscar "Halloween 2" abre Halloween 2;
    preview de pelicula -> pantalla completa conserva el inicio reanudado.
    Verificados lint, typecheck, 226 pruebas y builds web/core/webOS.
66. Confirmacion web del usuario: historial, busqueda, reanudacion,
    preview->pantalla completa y apertura correcta de catalogos OK. Fase 5 web
    cerrada. `pnpm check` con 226 pruebas; IPK 1.6.6 generado y validado
    estructuralmente. Pendiente Fase 6: instalacion/prueba en TV fisica,
    control remoto, persistencia y paridad del endpoint de duracion webOS.

67. Servicio webOS: agregado `/duration/<token>` con sonda ffmpeg de 15 s,
    cache de duracion por sesion y parseo de `Duration:` durante el stream.
    Sesion desconocida responde `{"duration":0}`. Validado `node --check`,
    endpoint smoke e IPK 1.6.6 regenerado y validado estructuralmente.
68. Validacion fisica webOS 1.6.7: instalacion correcta y flujos confirmados
    por el usuario: transicion episodio->temporada->episodio, catalogo,
    carga de titulos, busqueda y guardado de configuracion. IPK 1.6.7
    generada y validada estructuralmente. Fase 6 cerrada; la limpieza de
    duplicaciones legacy queda como mantenimiento no bloqueante.
69. TV en vivo: filtrado de canales visibles por favoritos, conservando los
    indices originales, y busqueda de canales/categorias extraidos a Core
    (`liveChannels`). `Ht` y `lvRenderResults` usan wrappers con fallback.
    Verificados lint, typecheck, 235 pruebas y builds web/core/webOS. No se
    regenero IPK ni se probo en TV en este incremento.
70. TV en vivo/Addons: normalizacion de categorias del portal, fallback y
    entrada de Addons M3U extraidos a `liveCategories`; validacion HTTP(S) y
    alta/actualizacion por URL extraidas a `addons`. `Bt`, `Xt` y la validacion
    de URL usan wrappers con fallback. Verificados lint, typecheck, 243 pruebas
    y builds web/core/webOS. No se regenero IPK ni se probo en TV.
71. TV en vivo: deduplicacion por `channelCode` al paginar canales extraida a
    Core; `Bt` la usa mediante `legacySelectNewLiveChannels` con fallback.
    Verificados lint, typecheck, 245 pruebas y builds web/core/webOS. No se
    regenero IPK ni se probo en TV.
72. TV en vivo/Addons: etiqueta/estado de categoria y scroll de lista extraidos
    a Core; deteccion de addon instalado y eliminacion por indice agregadas a
    `addons`. `liveUpdateLabel`, `zt` y `$t` usan wrappers con fallback.
    Verificados lint, typecheck, 252 pruebas y builds web/core/webOS. No se
    regenero IPK ni se probo en TV.
73. Busqueda de TV en vivo unificada: las categorias se muestran desde el
    inicio y elegir una recarga sus canales sin cerrar el dialogo de busqueda;
    la busqueda de canales sigue en la categoria activa. `Bt`/`Ut` notifican al
    completar la paginacion para refrescar resultados. Verificados lint,
    typecheck, 252 pruebas y builds web/core/webOS. No se regenero IPK ni se
    probo en TV.

## Riesgos pendientes

- monolito `app.js` con acoplamiento UI+plataforma elevado
- diferencias de compatibilidad entre webOS 4.x y versiones superiores
- coexistencia temporal de dos pipelines (legacy + modular)
- la coordinacion restante de relay, persistencia, eventos y estado del
  reproductor, y las reglas de visibilidad/foco especificas, siguen en el monolito
- `tuty-core.js` de `source/` es generado e ignorado; `build:ipk` lo genera.
  Web dev usa el modulo compartido y `build:web` genera su propio puente en
  `dist/web`, sin depender del artefacto de webOS
- en dev `app.js` se carga como modulo y en produccion/webOS como script
  clasico; validar paridad visual al cambiar el bootstrap
- el override de Rollup depende del CPU de build; revisar en otra maquina

## Politica de no regresion

- no tocar IDs, rutas de empaquetado ni servicio
- no eliminar archivos legacy sin trazabilidad de dependencias
- no introducir dependencias runtime innecesarias
- no sustituir el reproductor actual en una sola fase
