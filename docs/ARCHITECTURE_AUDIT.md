> Documento historico de la Fase 0 (auditoria inicial). El estado vigente
> esta en `docs/ARCHITECTURE.md`.

# TutyTV - Architecture Audit (Fase Inicial Obligatoria)

Fecha: 2026-11-01

## 1) Alcance y criterio

Esta auditoria se realizo **sin mover ni reestructurar** archivos de la aplicacion funcional actual. Se analizo el estado real del proyecto para preparar una migracion incremental a TypeScript + Vite + Vitest + ESLint, preservando:

- ID de app webOS: `com.webosflux.xuptertv.fidelity`
- ID de servicio webOS: `com.webosflux.xuptertv.fidelity.service`
- Flujo de build IPK y validaciones de integridad
- Interfaz, navegacion, control remoto y reproduccion actuales

## 2) Inventario tecnologico actual

### Frontend app (TV + web)

- Stack: HTML + CSS + JavaScript sin framework UI.
- Entry UI principal: `src/webos/app/index.html`
- Script principal monolitico: `src/webos/app/js/app.js`
- Bridge webOS: `src/webos/app/js/webOSTV.js`
- Config runtime: `src/webos/app/config/api.js`

### Servicio webOS (Node/Luna)

- Entry servicio: `src/webos/service/index.js`
- Resolver/API portal: `magis.js`
- Proxy media/HLS virtual: `proxy.js`
- Relay ffmpeg TV: `ffmpeg-relay.js` + binario local `ffmpeg`
- Indexador TS (transport stream): `ts-indexer.js`

### Entorno web local

- Servidor dev web: `src/web/server.js`
- Relay ffmpeg web: `src/web/ffmpeg-web.js`
- HLS.js embebido: `src/web/hls.min.js`
- Launchers: `src/web/start.sh`, `src/web/start.bat`, `TUTY-WEB.sh`, `TUTY-WEB.bat`

### Empaquetado IPK

- Script principal: `src/tools/build-ipk.sh`
- Metadatos: `source/control`, `source/debian-binary`, `source/usr/palm/**/appinfo.json|packageinfo.json|services.json`

## 3) Sistema de build actual

No existe pipeline moderno unico (npm monorepo/workspace) para frontend/servicio. El build actual de release TV depende de `build-ipk.sh` y estructura fija de carpetas `source/usr/palm/...`.

- `build-ipk.sh`:
  - sincroniza version en `appinfo.json`, `packageinfo.json`, `service/package.json`, `control`, `index.html`
  - genera `control.tar.gz` + `data.tar.gz` + `debian-binary`
  - empaqueta con `bsdtar --format ar` (importante para compatibilidad)
  - valida estructura, integridad gzip/tar, rutas seguras y coherencia de metadatos

## 4) Analisis del script de IPK y restricciones criticas

Se detecta control robusto para evitar regresiones del error `Failed to extract package`:

1. Orden estricto AR: `debian-binary`, `control.tar.gz`, `data.tar.gz`
2. Prevencion de encabezados incompatibles tipo GNU (`control.tar.gz/`)
3. Integridad `gzip -t` y seguridad de rutas dentro de TAR
4. Verificacion de archivos obligatorios en `usr/palm/...`
5. Verificacion de coherencia de IDs y version

Conclusion: **no se debe reemplazar ni debilitar** esta validacion durante la migracion.

## 5) Puntos de entrada por plataforma

### webOS (TV)

- app entry: `appinfo.json -> main: index.html`
- UI runtime: `index.html` carga `js/webOSTV.js`, `data/portal.js`, `data/catalog.js`, `config/api.js`, `js/app.js`
- Service runtime: Luna service via `index.js` (`webos-service`)

### Web

- entry proceso: `src/web/server.js`
- sirve HTML de app webOS con inyecciones runtime:
  - `window.TUTYTV_WEB=true`
  - `hls.min.js`
  - override de `devServiceUrl` a `location.origin`
- reutiliza modulos de servicio (`magis.js`, `proxy.js`) para endpoints HTTP equivalentes

## 6) Dependencias reales del servicio Node.js

### Declaradas en package.json del servicio

- No hay `dependencies` listadas.
- Se declara `main: index.js` y version del servicio.

### Usadas en runtime

- Externa: `webos-service` (en TV/Luna runtime)
- Node built-in: `http`, `https`, `crypto`, `url`, `fs`, `child_process`
- Binario local: `ffmpeg` (TV) y ffmpeg del sistema (web)

Riesgo: en entorno web local, el servicio no depende de `webos-service` porque usa `src/web/server.js`; en TV si depende del runtime Luna.

## 7) Funcionalidades compartidas y acoplamientos

### Compartidas hoy (ya reaprovechadas)

- Llamadas al portal y sesion anonima: `magis.js`
- Resolucion de streams, canales y categorias
- Proxy de media y subtitulos: `proxy.js`

### Acoplamientos fuertes

- `app.js` mezcla UI, navegacion por foco, teclas remotas, reproduccion, persistencia y logica de dominio.
- `app.js` usa directamente:
  - DOM APIs
  - `localStorage`
  - deteccion de entorno (`window.TUTYTV_WEB`, `PalmServiceBridge`, userAgent)
  - logica de reproduccion HLS/nativa en el mismo modulo

Conclusiones para migracion:

- Hay material para extraer Core (normalizacion, filtros, utilidades, modelos), pero esta embebido en el monolito.
- Debe hacerse por extraccion progresiva (strangler pattern), no por reescritura.

## 8) Modulos especificos por plataforma

### Especificos webOS

- `js/webOSTV.js` (bridge y APIs webOS)
- uso de `PalmServiceBridge`/Luna en `app.js`
- servicio en `usr/palm/services/...`
- `ffmpeg-relay.js` con binario local `ffmpeg`

### Especificos Web

- `src/web/server.js`
- `src/web/ffmpeg-web.js`
- `src/web/hls.min.js`
- ramas en `app.js` protegidas por `window.TUTYTV_WEB`

## 9) Archivos/rutas que no pueden moverse sin adaptar referencias

Rutas criticas hardcodeadas por empaquetado y runtime:

- `src/webos/app/**`
- `src/webos/service/**`
- `src/webos/package/packageinfo.json`
- `source/control` y `source/debian-binary`
- `src/web/server.js` asume rutas relativas a `../usr/palm/...`

Cambiar ubicacion de estos archivos sin adaptar scripts/servidor rompe:

- empaquetado IPK
- arranque de app TV
- arranque de servicio
- servidor web local

## 10) Compatibilidad webOS y target de compilacion

Se contrasto documentacion oficial LG webOS TV (Web API and Web Engine):

- webOS TV 4.x -> Chromium 53
- webOS TV 5.x -> Chromium 68
- webOS TV 6.x -> Chromium 79

Implicacion para esta base (actualmente orientada a webOS 4 en docs internas):

- El build webOS debe considerar un target conservador compatible con Chromium 53 cuando se quiera cubrir TV 4.x.
- No se debe asumir soporte universal de ES modules en runtime TV legacy.
- Evitar introducir sintaxis/formatos incompatibles (p.ej. salida solo ESM para TV antiguas).

## 11) Dependencias/APIs potencialmente incompatibles con TV

- Salida ESM nativa para navegador (si se usa sin fallback IIFE/legacy) podria no iniciar en Chromium 53.
- Polyfills globales indiscriminados pueden aumentar riesgo y peso innecesario.
- HLS.js no debe imponerse en TV si el flujo actual usa HLS nativo.
- Nuevas APIs JS/CSS modernas deben evaluarse contra target real de TV.

## 12) Riesgos prioritarios de migracion

1. Romper estructura IPK esperada por extractor/installador.
2. Romper rutas `usr/palm/...` requeridas por webOS packaging/runtime.
3. Introducir formato de modulo no soportado en TV objetivo.
4. Mezclar Core con APIs de plataforma durante extraccion.
5. Desacoplar demasiado rapido `app.js` monolitico y perder funcionalidades.

## 13) Estrategia recomendada (sin reescritura)

1. Crear infraestructura paralela TypeScript/Vite/Vitest/ESLint sin sustituir entrypoints actuales.
2. Definir `Core` + `Contracts` y migrar primero funciones puras (normalizacion, filtros, modelos).
3. Mantener adaptadores actuales (web/webOS) y puentear gradualmente.
4. Ejecutar validaciones en cada etapa: lint, test Core, build web, build webOS, build IPK.
5. Conservar script `build-ipk.sh` y sus validaciones de integridad.

## 14) Resultado de la fase inicial

Fase de auditoria completada. No se movieron archivos funcionales ni se altero el runtime actual.

Siguiente fase permitida: incorporar infraestructura moderna incremental (TypeScript + Vite + Vitest + ESLint) preservando rutas y empaquetado actuales.
