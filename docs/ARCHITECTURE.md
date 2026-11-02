# TutyTV - Arquitectura Modular Objetivo (TypeScript + Vite)

Fecha: 2026-11-01

## 1. Objetivo arquitectonico

Evolucionar TutyTV hacia una arquitectura modular incremental que:

- comparta la mayor logica de negocio posible
- separe capas de plataforma (Web y LG webOS)
- preserve funcionalidad y UI actuales
- mantenga JavaScript como artefacto final de ejecucion
- mantenga el pipeline de empaquetado IPK existente

## 2. Estructura propuesta

```text
src/
  core/
    contracts/
      key-value-store.ts
      navigation-adapter.ts
      platform-adapter.ts
      player-adapter.ts
      storage-adapter.ts
    models/
      media.ts
    text/
      normalizeText.ts
      normalizeText.test.ts
    usecases/
      api/
        serviceRequest.ts
        serviceRequest.test.ts
      catalog/
        filterCatalog.ts
        filterCatalog.test.ts
        filterMatches.ts
        filterMatches.test.ts
        history.ts
        history.test.ts
        episodeDisplay.ts
        episodeDisplay.test.ts
        episodeNavigation.ts
        episodeNavigation.test.ts
      favorites/
        liveFavorites.ts
        liveFavorites.test.ts
      input/
        mediaKeys.ts
        mediaKeys.test.ts
      playback/
        duration.ts
        duration.test.ts
        nativeRetry.ts
        nativeRetry.test.ts
        languagePreference.ts
        languagePreference.test.ts
        playbackHistory.ts
        playbackHistory.test.ts
        playbackPreferences.ts
        playbackPreferences.test.ts
        relayDuration.ts
        relayDuration.test.ts
        seekPosition.ts
        seekPosition.test.ts
        streamMode.ts
        streamMode.test.ts
        subtitles.ts
        subtitles.test.ts
      storage/
        jsonStore.ts
        jsonStore.test.ts
        viewerProfile.ts
        viewerProfile.test.ts
      ui/
        focusScroll.ts
        focusScroll.test.ts
        focusVisibility.ts
        focusVisibility.test.ts

  platforms/
    shared/
      html5PlayerAdapter.ts
      html5PlayerAdapter.test.ts
      hlsRecovery.ts
      hlsRecovery.test.ts
      jsonStorageAdapter.ts
      jsonStorageAdapter.test.ts
      legacyCoreBridge.ts
      navigationAdapter.ts
      navigationAdapter.test.ts
      playbackCoordinator.ts
      playbackCoordinator.test.ts
      platformAdapter.ts
      platformAdapter.test.ts
    web/
      adapters/
        webStorageAdapter.ts
      index.html
      legacyCoreDev.ts
      legacyAdaptersIntegration.test.ts
      legacyHistoryIntegration.test.ts
      legacyPlatformIntegration.test.ts
      legacyPlayerIntegration.test.ts
      legacyStorageIntegration.test.ts
      main.ts
    webos/
      adapters/
        webOsStorageAdapter.ts
      legacyCoreBridge.ts
      main.ts

scripts/
  build-web.mjs
  build-web.test.ts
  vite-legacy-web-plugin.ts

source/usr/palm/applications/.../js/tuty-core.js  # generado, no versionado
```

## 3. Principios de diseno

### Core

- solo logica de negocio y transformaciones puras
- sin dependencias de DOM, `window`, `localStorage`, webOS ni Luna
- modelos y casos de uso con contratos tipados

### Contracts

- definen capacidades reales de cada plataforma
- no fuerzan metodos artificiales
- permiten implementar adaptadores por plataforma

### Platforms

- `web`: integra navegador y runtime web local
- `webos`: integra APIs webOS/Luna/remote focus
- ambas dependen de `core`, no al reves

## 4. Toolchain incorporado (fase inicial)

- pnpm como gestor de paquetes (`pnpm-lock.yaml`, `packageManager` en `package.json`)
- TypeScript: configuracion estricta progresiva (`tsconfig.base.json`)
- Vite: configuraciones independientes
  - `vite.web.config.ts` -> servidor web de desarrollo
  - `vite.core.web.config.ts` -> puente web en `dist/web/js/tuty-core.js`
  - `vite.webos.config.ts` -> salida `dist/webos`
  - `vite.core.config.ts` -> `js/tuty-core.js` dentro de la app legacy
- Vitest: pruebas del Core y adaptadores
- ESLint: reglas base + TypeScript + deteccion de ciclos (`import/no-cycle`)

### Nota sobre Rollup y CPUs sin AVX2

El binding nativo `@rollup/rollup-linux-x64-gnu@4.67.x` provoca `SIGILL` en CPUs
anteriores a Haswell (AVX sin AVX2), como el i7-3630QM de este entorno. Por eso
`pnpm-workspace.yaml` fija `rollup@4.45.1`, version verificada como compatible.
No eliminar ese override sin comprobar el CPU de build y volver a ejecutar
`pnpm run test`, `pnpm run build:web` y `pnpm run build:webos`.

### Nota de pnpm

`pnpm` solo aprueba scripts de build declarados en `pnpm-workspace.yaml`
(`allowBuilds`). Si se agrega una dependencia nativa nueva, ejecutar
`pnpm approve-builds` antes de asumir que su postinstall corrio.

## 5. Targets de compilacion

### Web

- target: `es2019`
- salida HTML + assets para navegadores modernos de escritorio

### webOS

- target: `chrome53`
- formato de salida: `iife`
- `inlineDynamicImports: true`
- motivacion: compatibilidad con webOS TV 4.x (Chromium 53) segun tabla oficial LG Web Engine

## 6. Comandos disponibles

```bash
pnpm install

pnpm dev              # web real con Vite + HMR + API Node
pnpm build:web        # build de produccion en dist/web
pnpm start:web        # sirve dist/web con la API Node
pnpm start            # sirve source/ sin build (legacy)

pnpm build:webos
pnpm build:core
pnpm build:ipk

pnpm test
pnpm typecheck
pnpm lint
pnpm check
```

`build:ipk` ejecuta `build:core` antes de empaquetar y luego el script
`source/tools/build-ipk.sh`. `build:core` genera
`source/.../js/tuty-core.js` (artefacto ignorado por git).

`build:web` ejecuta `scripts/build-web.mjs`, que copia la app legacy a `dist/web`
y agrega `hls.min.js`, excluyendo el puente generado para webOS. Despues Vite
compila el puente compartido para web (`es2019`) en `dist/web/js/tuty-core.js`.
No se reempaqueta la app legacy porque `app.js` contiene rutas de assets fijas
y un reempaquetado con hashes las romperia.

### Reparto Vite / Node

Vite, solo en desarrollo (`pnpm dev`):

- sirve la app real con raiz en `source/usr/palm/applications/...`
- inyecta HMR para CSS y para el Core
- monta la API Node como middleware en el mismo proceso
- transforma `tuty-core.js` y `app.js` como modulos de desarrollo

Node (`source/web/server.js`), en desarrollo y produccion:

- sesion Magis, proxy HLS, relay ffmpeg y rutas de API del portal
- relay web y servicio webOS: `/duration/<token>` sondea ffmpeg y expone la duracion real de la fuente
- inyeccion de globals de produccion y servido estatico de `dist/web`
- sigue siendo el backend de `pnpm start:web`; no se elimino ninguna ruta

`scripts/vite-legacy-web-plugin.ts` es el puente: intercepta los metodos de
`API_METHODS`, sirve `/hls.min.js` y reescribe el HTML solo en desarrollo. Al
agregar una ruta a `handleApi`, agregarla tambien a `API_METHODS` para que el
middleware de Vite la reconozca.
`src/platforms/web/legacyCoreDev.ts` expone `window.TutyCore` como modulo con
HMR; al cambiar `src/core`, se actualiza sin recargar. Los cambios en
`js/app.js` provocan recarga completa por ser el monolito legacy.

`npm` queda fuera del flujo del proyecto. No usar `npm install` ni
`package-lock.json`.

## 7. Integracion con sistema existente

La infraestructura moderna fue agregada en paralelo y **no reemplaza** aun:

- `source/usr/palm/applications/.../index.html`
- `source/usr/palm/applications/.../js/app.js`
- `source/usr/palm/services/...`
- `source/tools/build-ipk.sh`

Por lo tanto, la app funcional actual sigue siendo referencia estable durante la migracion.

### Frontera CommonJS del runtime legacy

El `package.json` raiz declara `"type": "module"` para el toolchain moderno. El
runtime legacy (`source/web/server.js`, servicio y modulos `require(...)`) es
CommonJS, por lo que `source/package.json` fija `"type": "commonjs"` como
frontera. Sin ese archivo, Node 24 trata `server.js` como ESM y el servidor web
falla con `require is not defined`. `source/package.json` no se empaqueta en el
IPK (el script solo incluye `control` y `usr`).

### Puente Core -> legacy

`src/platforms/shared/legacyCoreBridge.ts` expone las funciones y adaptadores
compartidos. En web, Vite lo sirve como modulo en desarrollo y lo compila como
IIFE (`es2019`) en `dist/web/js/tuty-core.js` para produccion. El puente webOS
`src/platforms/webos/legacyCoreBridge.ts` lo reexporta; `vite.core.config.ts`
lo compila como IIFE (`chrome53`) en `source/.../js/tuty-core.js` para el IPK.

`source/.../index.html` carga `js/tuty-core.js` antes de `js/app.js`. Las
funciones legacy `filterMatches`, `liveFavKey`, `liveIsFav`, `liveToggleFav`,
`findHistory` y `episodeIdExists` delegan en `window.TutyCore` cuando esta
disponible y conservan su implementacion original como fallback. Si el
artefacto no existe (por ejemplo, servidor web sin `build:core`), la app sigue
funcionando con el codigo legacy.

Los wrappers de almacenamiento `G` y `J` tambien delegan en el adaptador JSON
del puente, manteniendo sus implementaciones legacy como fallback. El adaptador
preserva el comportamiento previo ante JSON invalido, `null` explicito y errores
de almacenamiento; las claves y el formato de perfil no cambian.

La navegacion registra los eventos legacy de teclado y control remoto mediante
el adaptador y usa la puntuacion compartida de foco direccional; los casos de
foco especificos de UI siguen en el monolito. Plataforma integra la seleccion
HLS para TV/preview, el servicio Luna y la salida, manteniendo sus reglas
previas. El adaptador HTML5
realiza las operaciones de fuente, carga, HLS externo, inicio, pausa y seek
tanto en el reproductor como en el preview. La limpieza HLS y la programacion
de reintentos condicionados usan el coordinador compartido. Los limites de seek
local/relay y la recuperacion de errores HLS.js estan extraidos a Core y al
adaptador compartido respectivamente. Core tambien selecciona los reintentos
nativos y construye el historial; el runtime conserva la coordinacion restante
de eventos, relay, estado y persistencia. Los puntos integrados conservan
fallback sin el puente.

## 8. Modulos ya migrados (inicial)

- Modelo tipado base de catalogo (`MediaItem`)
- Contratos base de plataforma/reproduccion/almacenamiento/navegacion y
  `KeyValueStore`
- Normalizacion de texto compartida (`normalizeText`) extraida del monolito
- Filtro de catalogo por consulta (`filterCatalogByQuery`)
- Filtro por categoria/genero (`filterMatches`), paridad con `app.js`
- Claves y estado de favoritos en vivo (`liveFavorites`)
- Busqueda en historial y validacion de episodios (`history`)
- TV en vivo: filtrado de canales visibles por favoritos, conservando indices,
  deduplicacion por `channelCode` al paginar y busqueda de canales/categorias
  con normalizacion compartida (`liveChannels`)
- Busqueda de TV en vivo unificada: las categorias aparecen desde el inicio y
  elegir una recarga sus canales sin cerrar la busqueda; la busqueda de canales
  sigue acotada a la categoria activa para no descargar todo el portal
- Favoritos de TV en vivo: corazon por canal en la lista, accesible con la
  flecha derecha, y filtro/contador de favoritos sobre la categoria activa
- Normalizacion de categorias del portal, fallback de categorias, entrada de
  Addons M3U y etiqueta/estado de la categoria activa (`liveCategories`)
- Carga live: seleccion inicial de addons, numeracion/favoritos de canales M3U
  y clamp de indice de canal (`liveLoading`)
- Scroll de la lista de canales al cambiar de fila (`liveFocus`)
- Addons M3U: validacion HTTP(S), deteccion de URL instalada,
  alta/actualizacion y eliminacion por indice (`addons`)
- API: normalizacion de sesion, validacion, parametros de servicio, resolucion
  de URL y descripcion de errores (`apiSession`)
- Recordatorios: alta/baja, deteccion de recordatorio activo, throttle de
  comprobacion, seleccion de IDs y fusion de nuevos episodios (`reminders`)
- Adaptador JSON de almacenamiento (`createJsonStorageAdapter`) con
  implementaciones Web y webOS
- Puente IIFE `tuty-core.js` integrado en el runtime legacy con fallback
- Adaptador de plataforma con deteccion de capacidades (`createPlatformAdapter`)
- Adaptador de navegacion/teclado (`createNavigationAdapter`)
- Adaptador HTML5/HLS con loader inyectable (`createHtml5PlayerAdapter`)
- Normalizacion de items del portal (`catalogNormalization`): extraccion de
  payloads anidados, series/temporadas, imagenes y metadatos
- Agrupacion de temporadas y mezcla de raices del portal con catalogo local
  (`catalogGrouping`)
- Busqueda local por titulo/alias y combinacion con resultados del portal,
  deduplicados por id (`catalogSearch`)
- Seleccion de pagina/categoria del catalogo, fallback con relleno unico por id
  y rangos de episodios (`catalogSelection`)
- Merge de detalle del catalogo y favoritos de contenidos (`catalogDetail`)
- Decisiones del ciclo de reproduccion (`playbackSession`): posicion absoluta
  en relay, duracion total, tipo de stream y eleccion de HLS.js
- Progreso de reproduccion (`playbackProgress`): throttle de historial, total
  relay con prioridad de fuentes y objetivos de seek local/relay
- Resolucion de reproduccion (`playbackResolve`): construccion de la peticion
  y aplicacion de metadatos/URL de la respuesta
- Siguiente reproduccion (`playbackNext`): seleccion de siguiente episodio o
  temporada con reparacion de indice de temporada desfasado y fallback por
  orden cuando la API repite el numero de temporada
- Aviso de siguiente episodio 7 s antes del final con avance automatico o
  cancelacion; tambien se activa al evento `ended` como respaldo
- Historial: al abrir un titulo se asegura la carga de detalle si el item
  en cache no la tenia; el cambio de episodio guarda el episodio anterior antes
  de reemplazarlo
- Reanudacion (`resumePlan`): decision de reanudar/reiniciar y reconstruccion
  del episodio guardado en historial
- Reglas de ciclo de vida (`playbackLifecycle`): guardado previo al reset, base
  de aborto local, carga previa de episodios, deteccion de sesion activa
  (incluye blob HLS) y reutilizacion de sesion
- Temporizacion del reproductor (`playbackTiming`): aviso de buffer, debounce de
  seek, heartbeat de historial, reset relay y retardo de resolucion live
- Audio/subtitulos: seleccion de pista de audio, normalizacion y orden de
  subtitulos, eleccion de subtitulo y etiquetas de idioma (`mediaTracks`)
- Cableado de eventos del video y de HLS centralizado (`playbackEventWiring`)
- Superficies y transiciones del reproductor (`playbackSurface`): video/poster,
  estado visible, modo VOD y transicion detalle-reproductor
- 318 pruebas automatizadas sin dependencia de televisor ni navegador
- Validacion fisica webOS 1.6.7: navegacion/control remoto, catalogo, carga de
  titulos, busqueda, configuracion y transicion episodio->temporada->episodio OK

## 9. Modulos pendientes prioritarios

- evaluar integracion adicional de navegacion/foco y capacidades de plataforma
- migrar la coordinacion restante de live TV (carga y foco), la UI de addons y
  los estados de UI que aun viven en `app.js`

## 10. Branding y compatibilidad de datos

El renombrado a TutyTV es **solo de marca visible**:

- se actualizaron titulo de app, bienvenida, textos, consola, documentacion,
  instaladores y nombre de los launchers (`TUTY-WEB.*`, `INSTALAR-TUTYTV.*`)
- se conservan los IDs tecnicos `com.webosflux.xuptertv.fidelity` y
  `com.webosflux.xuptertv.fidelity.service`
- se conservan las claves de almacenamiento `xuper_local_profile_v1`,
  `xuper_global_playback_v1` y `xuper_m3u_addons`
- se conservan los slugs de catalogo `xuper-*` y la URL externa
  `xuper-plugin/kino-plugin-xuper`

Motivo: cambiar IDs o claves rompe la instalacion sobre la app existente y la
continuidad de favoritos, historial y addons. Un renombrado total de IDs es una
migracion separada que requiere decision explicita.

## 11. Restricciones de seguridad funcional

- no cambiar IDs de app/servicio
- no alterar flujo de control remoto ni UX actual
- no sustituir reproductor actual de forma abrupta
- no debilitar validaciones de integridad IPK
- no afirmar pruebas fisicas en TV sin ejecucion real
