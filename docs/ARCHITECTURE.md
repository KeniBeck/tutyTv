# TutyTV - Arquitectura

Fecha: 2026-11-03

Estado: **Fase A de migracion cerrada**. Lista para iniciar el rediseno de UI
(`docs/UI_REDESIGN.md`). Base validada: IPK `1.7.2`, 504 pruebas.

## 1. Objetivo

Mantener una arquitectura modular incremental que:

- concentre la logica de aplicacion en `src/`
- separe Core, plataformas, runtime UI y capa legacy de compatibilidad
- preserve los flujos, IDs, claves de almacenamiento y servicio webOS
- mantenga JavaScript como artefacto final para Chromium 53
- conserve el pipeline de empaquetado IPK

## 2. Estructura actual

```text
src/
  core/
    contracts/          Contratos de almacenamiento, navegacion, plataforma y player
    models/             Modelos de dominio
    text/               Normalizacion de texto
    usecases/           Logica pura: API, catalogo, live, playback, storage, UI

  platforms/
    shared/             Adaptadores y puente Core compartido
    web/                Entrada de desarrollo web y plugin Vite
    webos/              Entrada de validacion webOS y puente Core chrome53

  ui/
    main.ts             API publica del bundle TutyUI
    dev.ts              Exposicion de TutyUI en desarrollo web
    runtime/            Estado, DOM, foco, navegacion, router, servicio, hosts
    screens/            Home, detalle, busqueda, ajustes y reproductor
    legacy/
      legacyApp.js      Arranque de la capa legacy
      legacyStore.js    Estado, inicializacion y contextos
      legacyActions.js  Acciones de aplicacion
      legacyWiring.js   Cableado de navegacion, stage, player y UI
      legacyRuntime.js  Config API, servicio y alias Core/TutyUI
      legacyAttach.js   Attach de runtimes
      legacyBootstrap.js Arranque y carga inicial
      legacyState.js    Estado base

  webos/
    app/
      index.html        Shell estatico de pantallas
      css/style.css     Presentacion actual (canvas 1920x1080)
      assets/           Imagenes, fuentes y referencias visuales
      config/api.js     Configuracion de API
      data/             Catalogo y portal de respaldo
      js/app.js         Bootstrap webOS (6 lineas)
      js/tuty-core.js   Generado por build:core
      js/tuty-ui.js     Generado por build:ui
    package/            Metadatos del paquete webOS
    service/            Servicio Luna: Magis, proxy HLS y relay ffmpeg
    control             Metadatos de control del IPK
    debian-binary       Version de formato del IPK

  web/                  Servidor local, HLS de escritorio y relay web
  tools/build-ipk.sh    Generador, staging y validador de IPK

scripts/                Plugin Vite legacy y staging del build web
docs/                   Arquitectura, migracion y handoff de UI
```

## 3. Flujo de arranque

`index.html` carga, en orden:

1. `js/webOSTV.js`
2. `data/portal.js` y `data/catalog.js`
3. `config/api.js`
4. `js/tuty-core.js` (`window.TutyCore`)
5. `js/tuty-ui.js` (`window.TutyUI`)
6. `js/app.js`

`app.js` solo verifica `TutyUI.startLegacyApp` y lo invoca. El arranque real es:

```text
app.js
  -> TutyUI.startLegacyApp()
  -> src/ui/legacy/legacyApp.js
  -> legacyStore.js
  -> legacyActions.js + legacyWiring.js + legacyRuntime.js
  -> src/ui/runtime y src/ui/screens
```

La capa `src/ui/legacy` conserva la semantica funcional de la app original y
sirve como puente hasta que el rediseno de UI reemplace la presentacion. No es
un monolito externo: vive en `src/` y se compila dentro de `tuty-ui.js`.

## 4. Limites entre capas

### Core

- logica pura y transformaciones
- sin DOM, `window`, `localStorage`, webOS ni Luna
- contratos tipados y pruebas unitarias

### Platforms

- `shared`: adaptadores reutilizables y puente de funciones Core
- `web`: desarrollo/build web con target `es2019`
- `webos`: validacion del target modular y puente Core `chrome53`

### UI

- runtime: estado, foco, navegacion, router, servicio y hosts
- screens: construccion y comportamiento de pantallas
- legacy: compatibilidad funcional y contexto de la app actual

### App webOS

- contenedor, assets, CSS, configuracion y servicio Luna
- `app.js` no contiene logica de negocio ni pantallas

## 5. Builds y artefactos

| Comando | Resultado | Uso |
|---|---|---|
| `pnpm dev` | Vite + API Node sobre `src/webos/app` | Desarrollo web con HMR |
| `pnpm build:core` | `src/webos/app/js/tuty-core.js` | Bundle Core `chrome53` |
| `pnpm build:ui` | `src/webos/app/js/tuty-ui.js` | Bundle UI `chrome53` |
| `pnpm build:web` | `dist/web` | Produccion web |
| `pnpm start:web` | Sirve `dist/web` + API | Smoke test de produccion |
| `pnpm build:webos` | `dist/webos` | Validacion del target modular |
| `pnpm build:ipk` | IPK en la raiz | Instalacion en TV |

`tuty-core.js`, `tuty-ui.js`, `dist/` y los `.ipk` son artefactos generados y
estan ignorados por Git. El IPK se ensambla en un staging temporal desde
`src/webos` mediante `src/tools/build-ipk.sh`; no existe una carpeta `source/`.

## 6. Compatibilidad webOS 4 / Chromium 53

Obligatorio para todo cambio de UI:

- target `chrome53` en Core y UI
- sin CSS Grid, `gap`, `aspect-ratio` ni `:focus-visible` como dependencia
- sin `backdrop-filter` obligatorio; fallback opaco
- `outline` no sigue de forma fiable el `border-radius`: para focos
  redondeados usar `box-shadow`
- evitar `filter: blur()` en superficies grandes
- no animar `width`, `height`, `filter` ni sombras grandes en listas
- conservar el canvas de 1920x1080 y el escalado existente
- validar en TV fisica despues de cada bloque visual

## 7. Foco y navegacion

La implementacion vive en:

- `src/ui/runtime/focus.ts`: foco actual y movimiento direccional
- `src/ui/runtime/screenFocus.ts`: visibilidad, scroll y restauracion por tab
- `src/ui/runtime/navigation.ts`: BACK, overlays, player y salida de la app
- `src/ui/runtime/navigationActions.ts`: acciones de navegacion
- `src/ui/screens/*`: topologia y restauracion de foco por pantalla

Reglas:

- el estado de foco es un solo elemento con clase `is-focused`
- no depender de `:hover` ni `:focus-visible` para TV
- no reordenar focusables sin validar las cuatro direcciones
- las cargas asincronas no deben robar el foco
- BACK cierra overlays antes de navegar; en Home vuelve al menu lateral antes
  de salir de la app
- el foco debe quedar completamente visible dentro de contenedores con scroll

El handoff visual y las reglas de foco para la Fase 7 estan en
`docs/UI_REDESIGN.md`, seccion 5.

## 8. Compatibilidad de datos

Se conservan sin cambios:

- IDs `com.webosflux.xuptertv.fidelity` y su servicio
- claves de almacenamiento (`xuper_local_profile_v1` y relacionadas)
- formato de perfil, historial, favoritos y recordatorios
- API Magis y metodos del servicio Luna
- estructura y validacion del IPK

## 9. Calidad

```bash
pnpm check          # lint + lint legacy + typecheck + 504 pruebas
pnpm build:web
pnpm build:webos
pnpm build:ipk 1.7.2
```

Criterio de cierre de cada bloque:

- app funcional en web y TV
- sin regresiones de foco, scroll ni reproduccion
- `pnpm check`, builds web/webOS e IPK verdes
- prueba fisica en TV para cambios de UI

## 10. Siguiente fase

La Fase A queda cerrada. La Fase 7 (rediseno UI) puede iniciar con cambios
progresivos por pantalla. El orden recomendado, tokens, componentes, foco,
compatibilidad y criterios de aceptacion estan en `docs/UI_REDESIGN.md`.
