# TutyTV

Aplicacion de TV para LG webOS y version web local. El flujo principal de
desarrollo, compilacion, pruebas y empaquetado se gestiona con **pnpm**.

Estado actual: **Fase A de migracion cerrada** y validada en TV fisica con la
IPK `1.7.2`. La logica de aplicacion vive en `src/`; la app webOS solo conserva
el contenedor, assets y un bootstrap de 6 lineas. La siguiente etapa es el
rediseno de UI documentado en `docs/UI_REDESIGN.md`.

## Requisitos

- Node.js 20 o superior (probado con Node 24)
- pnpm (el repositorio fija `pnpm@12.16.1` en `package.json`)
- Opcional: `ffmpeg` para transcodificar VOD H.265 en la version web
- Solo para `pnpm build:ipk`: Linux/WSL con Bash, `ar`, `tar`, `sed`, `du`,
  `awk`, `file`, `bsdtar` y `gzip`. El desarrollo web (`pnpm dev`) no usa Bash.

```bash
pnpm install
```

## Desarrollo web con HMR

```bash
pnpm dev
```

- Vite sirve la app real desde
  `src/webos/app/`.
- Las APIs que necesitan Node (`magis`, proxy HLS y relay ffmpeg) se montan
  como middleware en el mismo proceso de Vite. No hace falta otro servidor ni
  scripts Bash.
- URL por defecto: `http://127.0.0.1:8910/`
- Cambiar puerto: `pnpm dev --port=9000`
- Exponer en la red local para probar desde la TV: `pnpm dev --host=0.0.0.0`

HMR:

- CSS, modulos del Core (`src/core`) y runtime UI (`src/ui`, incluido
  `src/ui/legacy`) se actualizan sin recargar la pagina.
- `js/app.js` es solo el bootstrap de arranque: al editarlo, Vite hace una
  recarga completa.
- `js/tuty-core.js` y `js/tuty-ui.js` son artefactos generados; no se editan a
  mano.

## Produccion web

```bash
pnpm build:web
pnpm start:web
```

- `build:web` prepara la app y compila el puente Core y el runtime UI web en
  `dist/web/js/tuty-core.js` y `dist/web/js/tuty-ui.js`, sin escribir artefactos
  generados dentro de `src/webos/app`.
- `start:web` sirve `dist/web` y la API Node en
  `http://127.0.0.1:8910/` (no abre el navegador).
- Cambiar puerto: `pnpm start:web --port=9000`
- `pnpm start` sirve la app directamente desde `src/webos/app` sin build.

## WebOS e IPK

```bash
pnpm build:webos      # bundle modular para webOS -> dist/webos
pnpm build:ipk        # genera y valida el IPK en la raiz del repo
```

`build:ipk` ejecuta `build:core`, `build:ui` y luego
`src/tools/build-ipk.sh`. El IPK mantiene el identificador tecnico
`com.webosflux.xuptertv.fidelity`. La version actual es `1.7.2`.

## Calidad

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm check            # lint + typecheck + test
```

## Comandos disponibles

| Comando | Descripcion |
| --- | --- |
| `pnpm dev` | Desarrollo web con Vite, HMR y API Node integrada |
| `pnpm dev:web` | Alias de `pnpm dev` |
| `pnpm build:core` | Compila el Core compartido como IIFE (`js/tuty-core.js`) |
| `pnpm build:ui` | Compila el runtime UI como IIFE (`js/tuty-ui.js`) |
| `pnpm build:web` | Build de produccion web en `dist/web` |
| `pnpm start:web` | Sirve `dist/web` + API en modo produccion |
| `pnpm start` | Sirve la app desde `src/webos/app` sin build |
| `pnpm build:webos` | Build de validacion del target modular webOS en `dist/webos` |
| `pnpm build:ipk` | Genera y valida el IPK |
| `pnpm lint` | ESLint sobre `src`, `scripts` y configs |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest |
| `pnpm check` | Calidad completa (lint + typecheck + test) |

## Auditoria: que hace Vite y que sigue en Node

Vite, solo en desarrollo:

- sirve HTML, CSS, assets y la app actual
- aplica HMR a CSS y al Core
- transforma `tuty-core.js` y `app.js` como modulos de desarrollo
- inyecta `TUTYTV_WEB`, `TUTYTV_WEB_BUILD` y `devServiceUrl`

Node (`src/web/server.js`), necesario en desarrollo y produccion:

- API del portal: `home`, `search`, `detail`, `resolve`, `resolveLive`,
  `liveChannels`, `liveCategories`, `fetchM3u`, `mediaInfo`, `prewarm`, etc.
- sesion Magis, proxy HLS y relay ffmpeg para H.265
- inyeccion de globals de produccion
- servido estatico de `dist/web` en `start:web`

El build web de produccion copia el contenedor webOS a `dist/web` en lugar de
reempaquetarla con Vite. Asi se conservan las rutas de assets usadas por
`app.js` y no se altera ningun comportamiento existente.

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `PORT` | Puerto por defecto del servidor Node (8910) |
| `HOST` | Host por defecto del servidor Node (127.0.0.1) |
| `TUTY_APP_DIR` | Directorio de la app a servir (util para staging) |
| `TUTY_NO_OPEN` | `1` evita abrir el navegador en `pnpm start` |
| `XUPER_NO_OPEN` | Alias legacy de `TUTY_NO_OPEN` |
| `FFMPEG` | Ruta al binario de ffmpeg (por defecto `ffmpeg`) |
| `NEXTFFMPEG_PORT` | Puerto del relay ffmpeg (por defecto 8787) |

## Estructura

```text
src/
  core/               Logica pura, contratos y casos de uso
  platforms/          Adaptadores compartidos, web y webOS
  ui/                 Runtime, pantallas, legacy y bootstrap UI
  webos/
    app/              Shell, CSS, assets, datos, config y bootstrap webOS
    package/          Metadatos del paquete webOS
    service/          Servicio Luna
    control           Metadatos del IPK
    debian-binary     Formato del IPK
  web/                Servidor local y utilidades web
  tools/              Generador, staging y validador de IPK
scripts/              Plugin Vite legacy y staging de produccion web
docs/                 Arquitectura, plan y handoff de rediseno UI
dist/web/             Build web de produccion (generado, ignorado)
dist/webos/           Build de validacion webOS (generado, ignorado)
```

## Notas

- En la TV se usa HLS nativo de webOS; en escritorio se usa `hls.min.js`.
- El portal entrega casi todo el VOD en H.265/HEVC. La web necesita `ffmpeg`
  para transcodificar a H.264/AAC.
- El override `rollup@4.45.1` de `pnpm-workspace.yaml` evita `SIGILL` en CPUs
  sin AVX2. No lo elimines sin validar en otra maquina.
- Los lanzadores `TUTY-WEB.sh` / `TUTY-WEB.bat` siguen disponibles, pero el
  flujo recomendado es `pnpm dev` y `pnpm start:web`.
- Los `.ipk` son artefactos de salida y estan ignorados por Git; se regeneran
  con `pnpm build:ipk`.
- Antes de tocar estilos de foco, revisar las reglas de compatibilidad webOS en
  `docs/UI_REDESIGN.md`, seccion 5.
