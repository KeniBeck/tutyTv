# TutyTV - Rediseno UI Dark Glassmorphism

Fecha: 2026-11-02  
Estado: direccion visual aprobada. **Implementacion bloqueada hasta completar la
Fase A de migracion modular** (`docs/MIGRATION_PHASE_A.md`).  
Base funcional congelada: 1.6.17, 318 pruebas, transicion de temporada validada.

## 1. Objetivo

Modernizar la experiencia visual de TutyTV con una identidad **Dark
Glassmorphism** premium y cinematografica, manteniendo intactas la logica, la
navegacion, el reproductor, los datos y el empaquetado existentes.

El piloto cubre unicamente:

1. Home: shell visual y pagina DESTACADOS como representante del lenguaje.
2. TV en vivo: preview, panel de canales, categorias y busqueda integrada.

El resto de Home (PELICULA, SERIES, KIDS, ANIME, EXPLORAR) y las demas
pantallas quedan fuera de esta primera aprobacion. Se aplicaran despues de
validar los componentes del piloto.

## 2. Inspeccion tecnica

### 2.1 Arquitectura actual

- `src/core/`: logica pura y casos de uso, sin DOM ni webOS.
- `src/platforms/shared/`: adaptadores compartidos, foco/navegacion, reproductor
  HTML5, almacenamiento y puente `legacyCoreBridge`.
- `src/platforms/web/` y `src/platforms/webos/`: entrada y adaptadores por
  plataforma.
- `source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js`:
  runtime legacy y UI DOM actual.
- `source/usr/palm/applications/com.webosflux.xuptertv.fidelity/index.html`:
  shell estatico de todas las pantallas.
- `source/usr/palm/applications/com.webosflux.xuptertv.fidelity/css/style.css`:
  estilos legacy, coordenadas absolutas sobre canvas de 1920x1080.
- `js/tuty-core.js`: artefacto generado por `pnpm build:core`; no se edita.

La UI **no** es React ni un sistema de componentes. Es DOM creado por `app.js`,
posicionado en pixeles absolutos y escalado desde 1920x1080 al viewport real.

### 2.2 Archivos que controlan el piloto

| Responsabilidad | Archivo / referencia |
|---|---|
| Shell de Home | `index.html:27` `#screen-home` |
| Contenedor de paginas | `index.html:28` `#home-pages` |
| Rail lateral | `index.html:30` `#home-tabs` |
| Barra de estado/utilidades | `index.html:31-32` |
| Overlay de categorias live | `index.html:39` `#live-categories` |
| Busqueda live | `index.html:48` `#live-search` |
| Definicion de tabs | `js/app.js:411` `H` |
| Paginas Home | `js/app.js:2080` `ct` |
| Montaje de Home | `js/app.js:2221` `vt()` |
| Cambio de tab/pagina | `js/app.js:2312` `ht()` |
| Preview y lista live | `js/app.js:2080-2110` |
| Lista de canales | `js/app.js:2764` `Ht()` |
| Categorias live | `js/app.js:2893` `lvBuildCats()` |
| Apertura de categorias | `js/app.js:2951` `lvOpenCats()` |
| Busqueda live | `js/app.js:3091` `lvOpenSearch()` |
| Foco visual | `js/app.js:1809` `tt()` |
| Navegacion direccional | `js/app.js:1838` `at()` |
| Escalado 1920x1080 | `js/app.js:5871` `mr()` |
| Estilos Home | `css/style.css:115` |
| Estilos rail | `css/style.css:170` |
| Estilos live | `css/style.css:378` |
| Estilos overlays live | `css/style.css:3685` y `3771` |

### 2.3 Restricciones detectadas

- Home usa posiciones absolutas y un viewport fijo de `1920x940.5`; no hay
  reflow responsive. El rediseno debe respetar ese modelo o cambiarlo de forma
  aislada y verificable.
- Las paginas Home se generan por JavaScript. Cambiar solo CSS no permite
  reorganizar el DOM; cualquier nuevo contenedor debe hacerse sin alterar
  datos, orden de foco ni contratos.
- El rail actual tiene 354 px y se expande/colapsa por foco. La topologia de
  foco izquierda-contenido se conserva en esta propuesta.
- TV en vivo usa preview 1280x720 a la izquierda y lista de 388.5 px a la
  derecha; los botones de categorias/favoritos/busqueda viven sobre la lista.
- El foco se representa con `is-focused`; no usar `:focus-visible` como unica
  solucion por compatibilidad con webOS 4.
- `backdrop-filter` **no** existe en Chromium 53. Es imprescindible un fallback
  opaco/translucido sin blur.
- Chrome 53 no soporta CSS Grid, `gap` en flexbox, `aspect-ratio` ni
  `clamp()`. La implementacion debe usar flexbox, margenes y tamanos fijos.
- Las imagenes se cargan por el mecanismo diferido existente; no introducir
  lazy loading paralelo.
- No se tocan IDs, claves `xuper_*`, rutas, API, servicio, empaquetado ni
  comportamiento del reproductor.

## 3. Direccion visual

### 3.1 Concepto

**Cine nocturno, cristal y luz roja.** La interfaz debe sentirse como una sala
de proyeccion premium: fondo azul-negro profundo, contenido como protagonista y
cristal solo donde separa informacion del video.

El vidrio no es decoracion global. Se usa en:

- barra superior;
- rail de navegacion;
- panel de canales live;
- tarjetas de metadatos;
- overlays de categorias/busqueda;
- dialogos y avisos.

Las tarjetas de contenido usan gradientes, bordes y sombras; **no** blur por
tarjeta.

### 3.2 Principios

1. Contenido primero: el poster/video manda, el cristal enmarca.
2. Contraste antes que estetica: ningun texto sobre imagen sin capa de lectura.
3. Foco inequivoco: anillo blanco + halo rojo, visible a 3 m.
4. Profundidad en capas: fondo, contenido, cristal, foco.
5. Movimiento corto: solo para orientar, nunca para decorar.
6. Rendimiento webOS: blur limitado, sin animaciones continuas.
7. Consistencia: un token, un uso; sin colores o radios "a ojo".

### 3.3 Evitar

- Cristal sobre cristal sin necesidad.
- `backdrop-filter` en listas completas o cards repetidas.
- Blanco puro en superficies grandes.
- Degradados morados ajenos a la marca.
- Animaciones de blur, filtros o box-shadow en cada frame.
- Foco basado solo en cambio de color.
- Redisenar la logica o mover elementos de sitio sin justificacion.

## 4. Design tokens

Los tokens se definiran como CSS custom properties. Chrome 53 soporta variables
CSS, por lo que son compatibles con webOS 4.

### 4.1 Color

| Token | Valor | Uso |
|---|---|---|
| `--ink-0` | `#05070c` | Fondo base |
| `--ink-1` | `#080c16` | Fondo de pantalla |
| `--ink-2` | `#0e1523` | Fondo de panel |
| `--surface-1` | `#121a2a` | Superficie elevada |
| `--surface-2` | `#182338` | Superficie interactiva |
| `--text-1` | `#f5f8ff` | Texto principal |
| `--text-2` | `#b3bfd2` | Texto secundario |
| `--text-3` | `#7f8da3` | Metadatos |
| `--accent` | `#c91923` | Rojo TutyTV |
| `--accent-bright` | `#e50914` | Hover/realce |
| `--accent-deep` | `#6f0b16` | Profundidad/glow |
| `--success` | `#42d392` | Estados correctos |
| `--warning` | `#f6c453` | Avisos |
| `--info` | `#6ea8fe` | Informacion |
| `--line` | `rgba(255,255,255,.12)` | Borde hairline |
| `--line-strong` | `rgba(255,255,255,.22)` | Borde activo |
| `--focus` | `#ffffff` | Anillo de foco |
| `--glow` | `rgba(201,25,35,.42)` | Halo de foco/acento |

Regla: el rojo se usa para foco, seleccion y acciones; no como fondo dominante.
El 80% de la pantalla debe ser azul-negro/carbon.

### 4.2 Tipografia

- Familia: `Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif`.
- No se agregan fuentes nuevas ni dependencias.
- Escala TV (px, canvas 1920x1080):

| Rol | Tamano | Linea | Peso |
|---|---:|---:|---:|
| Display / hero | 56 | 62 | 700 |
| Titulo pantalla | 44 | 50 | 700 |
| Titulo seccion | 32 | 38 | 700 |
| Titulo card | 26 | 32 | 600 |
| Cuerpo | 24 | 32 | 400 |
| Metadatos | 22 | 28 | 400 |
| Etiqueta/badge | 20 | 24 | 600 |
| Hint remoto | 20 | 26 | 500 |

- Tracking: `0` en cuerpo; `0.2px` en etiquetas mayusculas.
- Evitar textos menores a 20 px en TV.
- Maximo 2 lineas de sinopsis; el resto se trunca.

### 4.3 Escala y espaciado

Base 8 px:

`4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96`

Uso:

- margen exterior de pantalla: 80 px;
- separacion rail-contenido: 32 px;
- separacion entre secciones: 48 px;
- padding interno de panel: 24/32 px;
- separacion entre cards: 20 px;
- gap de icono-texto: 12 px.

No usar `gap` de flexbox en webOS 4; usar `margin`.

### 4.4 Radios

| Token | Valor | Uso |
|---|---:|---|
| `--r-xs` | 6px | Badges |
| `--r-sm` | 10px | Botones compactos |
| `--r-md` | 14px | Cards |
| `--r-lg` | 20px | Paneles |
| `--r-xl` | 28px | Hero/overlays |
| `--r-pill` | 999px | Chips/pills |

### 4.5 Bordes y superficies

- Borde normal: `1px solid var(--line)`.
- Borde activo: `1px solid var(--line-strong)`.
- Foco: `3px solid var(--focus)` + `0 0 0 6px var(--glow)`.
- Superficie de card: gradiente vertical `rgba(24,35,56,.78)` a
  `rgba(9,14,24,.92)`.
- Sin bordes negros duros; usar separadores con transparencia.

### 4.6 Sombras

| Token | Valor | Uso |
|---|---|---|
| `--shadow-sm` | `0 2px 8px rgba(0,0,0,.28)` | Chips |
| `--shadow-md` | `0 10px 30px rgba(0,0,0,.38)` | Paneles |
| `--shadow-lg` | `0 24px 70px rgba(0,0,0,.55)` | Hero/overlay |
| `--shadow-glow` | `0 0 24px var(--glow)` | Foco/accion |

No aplicar sombras grandes a listas completas.

### 4.7 Cristal, transparencia y blur

| Token | Valor | Uso |
|---|---|---|
| `--glass-soft` | `rgba(255,255,255,.055)` | Superficie sutil |
| `--glass` | `rgba(18,27,43,.66)` | Panel normal |
| `--glass-strong` | `rgba(10,16,27,.86)` | Overlay/lectura |
| `--glass-border` | `rgba(255,255,255,.14)` | Borde cristal |
| `--blur-sm` | `10px` | Chips/barra |
| `--blur-md` | `18px` | Rail/panel |
| `--blur-lg` | `24px` | Overlay |

Reglas:

- Maximo **2** superficies con blur visible por pantalla.
- El blur nunca cubre el video completo ni una fila de 10 cards.
- Fallback obligatorio:
  `@supports (backdrop-filter: blur(18px)) or (-webkit-backdrop-filter: blur(18px))`
  para el cristal; sin soporte, `--glass` se vuelve `rgba(13,20,33,.92)`.
- El texto sobre cristal debe tener capa de gradiente/opacidad adicional.

### 4.8 Estados

| Estado | Tratamiento |
|---|---|
| Default | Superficie + borde hairline |
| Hover (solo web) | Borde `--line-strong`, elevacion 1 px |
| Focus | Anillo blanco 3 px + halo rojo 6 px + escala 1.03 |
| Active | Fondo accent 18%, borde accent 60% |
| Selected | Pill/fondo accent, texto blanco, icono blanco |
| Disabled | Opacidad .42, sin foco, sin glow |
| Loading | Skeleton con gradiente estatico, sin shimmer continuo |
| Error | Borde warning, icono y texto de accion |

## 5. Foco y control remoto

### 5.1 Sistema de foco

- Clase existente: `is-focused`.
- Anillo exterior blanco de 3 px.
- Halo rojo de 6 px con `box-shadow`.
- Escala maxima 1.03 en cards; 1.0 en filas y paneles.
- Nunca depender solo del color.
- El foco debe quedar completamente visible; el scroll existente debe seguir
  funcionando.
- No animar `filter` ni `backdrop-filter` al enfocar.
- El foco del rail se muestra como pill de cristal rojo + texto blanco.
- El foco de canal live se muestra como fila con gradiente rojo y anillo.

### 5.2 Topologia

- Se conserva el orden espacial actual: rail a la izquierda, contenido a la
  derecha, utilidades arriba, lista live a la derecha.
- No se reordenan focusables ni se eliminan destinos de navegacion.
- Cualquier cambio de geometria debe validar que `at()` siga eligiendo el
  vecino correcto en las cuatro direcciones.
- Los overlays live mantienen su propio confinamiento de foco.

## 6. Animaciones

| Token | Duracion | Uso |
|---|---:|---|
| `--motion-fast` | 120ms | Foco/borde |
| `--motion-base` | 180ms | Botones/chips |
| `--motion-slow` | 260ms | Cambio de pagina |
| `--motion-hero` | 600ms | Crossfade de hero |

Curva: `cubic-bezier(.22,.61,.36,1)`.

Reglas:

- Solo `transform` y `opacity`.
- Sin animaciones infinitas salvo spinner de carga existente.
- El crossfade del hero solo corre si la pagina Home esta visible.
- Respetar `prefers-reduced-motion` en web; en webOS mantener duraciones
  cortas por rendimiento.
- No animar blur, sombras grandes ni `width/height`.

## 7. Layout propuesto 1920x1080

### 7.1 Home (shell + TV en vivo)

- Canvas: 1920x1080.
- Barra superior de cristal: y=24, alto 64 px; marca a la izquierda, credito de
  portal centrado, utilidades (buscar, filtro, perfil, hora) a la derecha.
- Rail de cristal: x=40, y=124, ancho 320; expandido al enfocar, colapsado a
  iconos al pasar al contenido. Conserva los 7 destinos actuales.
- Area de contenido: x=400, ancho 1480.
- Fondo: backdrop cinematografico oscurecido, sin competir con el hero.
- La pagina TV en vivo conserva preview grande a la izquierda y panel de
  canales a la derecha.
- Las paginas VOD conservan la logica de hero + cards, con superficies de
  cristal solo en metadatos y titulos de seccion.

### 7.2 TV en vivo

- Preview: x=80, y=124, 1160x760; marco de cristal, esquinas 20 px.
- Overlay inferior del preview: categoria + nombre de canal + estado EN VIVO +
  barra de progreso/EPG si existe.
- Panel derecho: x=1280, y=124, 560x858; cristal fuerte.
- Header del panel: "TV en vivo", contador de categorias, acciones
  Categorias/Favoritos/Buscar.
- Lista de canales: filas de 92 px, icono 64x64, numero, nombre y corazon.
- Fila enfocada: gradiente rojo sutil, anillo blanco, corazon visible.
- Footer de ayuda remota: OK reproducir, ARRIBA categorias, MENU filtros.
- Al abrir categorias, overlay de cristal con grid de 4 columnas (flex/float,
  no Grid). Al abrir busqueda, teclado en panel de cristal y resultados a la
  derecha.
- No se cambia el comportamiento de preview, zapping ni filtros.

### 7.3 Medidas de referencia

| Elemento | Medida |
|---|---:|
| Barra superior | 64 px (y=24) |
| Rail | 320 px |
| Margen externo | 80 px |
| Preview live | 1160x760 px |
| Panel live | 560x858 px |
| Fila canal | 88 px |
| Card vertical | 250x360 px |
| Card horizontal | 344x194 px |
| Hero VOD | 1040x620 px |
| Focus ring | 3 px + 6 px halo |

## 8. Componentes reutilizables

| Componente | Variantes | Notas |
|---|---|---|
| `AppTopBar` | Home, Live, Simple | Cristal, marca, utilidades |
| `NavRail` | Expandido, Colapsado | 7 tabs, icono+label, foco |
| `GlassPanel` | Soft, Normal, Strong | Un solo blur por panel |
| `HeroStage` | VOD, Live | Imagen/video + gradiente + metadata |
| `MediaCard` | Vertical, Horizontal, Continue | Sin blur; foco con anillo |
| `ContentRow` | Scroll horizontal | Titulo + cards; sin Grid |
| `LiveChannelRow` | Normal, Focused, Favorite | Numero, logo, nombre, corazon |
| `CategoryTile` | Normal, Selected, Focused | Overlay de categorias |
| `Pill` | Filter, Status, Badge | Selected usa accent |
| `IconButton` | Normal, Focused, Active | 44x44 minimo |
| `SearchField` | Idle, Typing, Empty | Teclado existente |
| `GlassDialog` | Resume, Confirm, NextEpisode | Fase posterior |
| `Toast` | Info, Error | Fase posterior |
| `Skeleton` | Card, Row, Panel | Sin shimmer continuo |
| `FocusRing` | Card, Row, Pill | Regla unica de foco |

Cada componente debe documentar: anatomia, medidas, estados, foco, fallback sin
blur y reglas de contenido.

## 9. Compatibilidad Web y webOS

### 9.1 Web

- Chromium moderno: puede usar `backdrop-filter`.
- El layout debe verse igual sin blur, solo con menor profundidad.
- Hover permitido, pero nunca reemplaza al foco.

### 9.2 webOS 4 / Chromium 53

- Variables CSS: soportadas.
- Flexbox: soportado; sin `gap`.
- CSS Grid: no usar.
- `backdrop-filter`: no soportado; fallback obligatorio.
- `aspect-ratio`, `clamp()`, `:focus-visible`: no usar como dependencia.
- `position: sticky`: no usar.
- `object-fit`: soportado; se mantiene el uso actual.
- Evitar `filter: blur()` en superficies grandes; es costoso.
- Evitar `will-change` permanente; solo durante una transicion puntual.
- Mantener target de 1920x1080 y escalado existente.

### 9.3 Rendimiento

- Presupuesto: 60 fps en navegacion y scroll; sin caidas sostenidas.
- Maximo 2 capas con blur visible por pantalla.
- Maximo 1 animacion de hero a la vez; solo en Home visible.
- No animar `box-shadow` en listas; usar borde/opacidad.
- No duplicar imagenes ni cargar posters fuera del viewport.
- Evitar sombras grandes sobre filas repetidas.
- Validar memoria GPU en TV tras 10 minutos de navegacion.
- Si el blur baja fps, desactivarlo por completo y conservar el fallback.

## 10. Limites de implementacion

- No se modifica Core, adaptadores, API, servicio, rutas, IDs, claves de
  almacenamiento ni empaquetado.
- No se sustituye el reproductor.
- No se migra a framework ni se agregan dependencias.
- No se elimina legacy sin trazabilidad.
- Los cambios visuales se haran en CSS y, solo si es imprescindible, en el DOM
  de presentacion.
- Propuesta de archivos futuros, sujetos a aprobacion:
  - `css/ui-glass.css`: tokens y componentes visuales, cargado despues de
    `style.css`.
  - Ajustes acotados en `index.html` solo para contenedores visuales.
  - Ajustes acotados en `app.js` solo si un componente necesita una clase o
    wrapper; sin tocar logica.
- Cualquier selector nuevo debe estar acotado a `#screen-home`,
  `#screen-player` o al componente correspondiente.

## 11. Plan de implementacion posterior

1. Crear tokens y primitivas visuales sin cambiar el DOM funcional.
2. Aplicar shell de Home: fondo, top bar, rail, foco.
3. Aplicar TV en vivo: preview, panel, lista, categorias, busqueda.
4. Validar Home TV en web y webOS.
5. Aplicar el mismo lenguaje al resto de paginas Home.
6. Validar regresion funcional, foco, scroll, carga de imagenes y rendimiento.
7. Documentar decisiones y resultados.

Cada etapa debe terminar con app funcional, `pnpm check`, build web, build webOS
y una prueba manual de navegacion.

## 12. Criterios de aceptacion del piloto

- Home y TV en vivo se ven claramente como Dark Glassmorphism.
- El rojo TutyTV sigue siendo el acento principal.
- El texto es legible a distancia de TV.
- El foco es evidente en todos los interactivos y no se pierde.
- La navegacion direccional conserva el comportamiento actual.
- No se rompe ninguna funcionalidad ni dato existente.
- Sin dependencias nuevas.
- Sin regresiones de TypeScript, ESLint, tests ni builds.
- En webOS 4 se ve bien sin `backdrop-filter`.
- No hay caidas de rendimiento perceptibles.

## 13. Propuesta visual

La propuesta grafica revisable esta en:

`docs/proposals/home-live-glass.html`

Es un artefacto estatico de revision. No se carga desde la app, no importa
`app.js` y no modifica el runtime. Muestra Home y TV en vivo a 1920x1080 con
tokens, foco, cristal y fallback.

## 14. Aprobacion pendiente

Antes de implementar se requiere aprobar:

- direccion visual y paleta;
- layout de Home y TV en vivo;
- sistema de foco;
- alcance del piloto;
- uso de `css/ui-glass.css`.
