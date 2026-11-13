# TutyTV - Rediseno UI Dark Glassmorphism

Fecha: 2026-11-02

Actualizado: 2026-11-05

Estado: direccion visual aprobada. **Fase A cerrada (2026-11-03). Fase 7 en
curso: Home y TV en vivo alineados a `home-live-glass.html`; detalle de serie y
pelicula minimalista aplicado al runtime y reflejado en
`detailts-catalog-glass.html`.**

Base funcional: IPK `1.7.2`, 508 pruebas, flujos web/TV y foco validados.
Caratulas de episodio: TVMaze + fallback, ver `docs/EPISODE_ARTWORK.md`.

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
- `src/platforms/shared/`: adaptadores compartidos y puente `legacyCoreBridge`.
- `src/platforms/web/` y `src/platforms/webos/`: entradas de build por target.
- `src/ui/runtime/`: estado, DOM, foco, navegacion, router, servicio y hosts.
- `src/ui/screens/`: pantallas Home, detalle, busqueda, ajustes y reproductor.
- `src/ui/legacy/`: compatibilidad funcional de la app actual dentro del bundle.
- `src/webos/app/js/app.js`: bootstrap webOS de 6 lineas.
- `src/webos/app/index.html`: shell estatico de todas las pantallas.
- `src/webos/app/css/style.css`: estilos actuales, canvas de 1920x1080.
- `src/webos/app/js/tuty-core.js` y `tuty-ui.js`: artefactos generados; no se editan.

La UI **no** es React ni un sistema de componentes. Es DOM vanilla posicionado
en pixeles absolutos y escalado desde 1920x1080 al viewport real.

### 2.2 Archivos que controlan el piloto

| Responsabilidad | Archivo / referencia |
|---|---|
| Shell de Home | `index.html` `#screen-home` |
| Contenedor de paginas | `index.html` `#home-pages` |
| Rail lateral | `index.html` `#home-tabs` |
| Barra de estado/utilidades | `index.html` `#home-notify` |
| Overlay de categorias live | `index.html` `#live-categories` |
| Busqueda live | `index.html` `#live-search` |
| Definicion de tabs | `src/ui/screens/home/homeTabs.ts` |
| Shell y montaje de Home | `src/ui/screens/home/homeShell.ts` |
| Paginas Home VOD | `src/ui/screens/home/homePages.ts` |
| Pagina TV en vivo | `src/ui/screens/home/homeLivePage.ts` |
| Lista y zapping live | `src/ui/screens/home/liveList.ts` |
| Categorias y busqueda live | `src/ui/screens/home/liveMenu.ts` |
| Panel de canales fullscreen | `src/ui/screens/player/liveChannelPanel.ts` |
| Foco visual | `src/ui/runtime/focus.ts` |
| Foco por pantalla y scroll | `src/ui/runtime/screenFocus.ts` |
| Navegacion y BACK | `src/ui/runtime/navigation.ts` |
| Escalado 1920x1080 | `src/ui/runtime/layout.ts` |
| Estilos Home | `css/style.css` |
| Estilos live | `css/style.css` |
| Bootstrap webOS | `js/app.js` |

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

Esta seccion es obligatoria para la Fase 7. Los problemas de foco detectados en
TV no fueron visuales solamente: afectaron navegacion, restauracion de foco y
salida de la app.

### 5.1 Sistema de foco

Implementacion actual:

- `src/ui/runtime/focus.ts`: elemento enfocado, `is-focused` y movimiento.
- `src/ui/runtime/screenFocus.ts`: visibilidad, scroll y restauracion por tab.
- `src/ui/runtime/navigation.ts`: BACK, overlays, player y salida.
- `src/ui/runtime/navigationActions.ts`: acciones de navegacion.

Reglas visuales:

- Clase existente: `is-focused`. No depender de `:hover`, `:focus` ni
  `:focus-visible` en TV.
- Anillo exterior blanco de 3 px + halo rojo. Construirlo con `box-shadow`, no
  con `outline`.
- **Chromium 53 dibuja `outline` cuadrado aunque el elemento tenga
  `border-radius`.** Para pills, circulos y botones redondeados usar
  `box-shadow` exterior/interior.
- El radio del foco debe coincidir con el radio del componente. No aplicar
  `border-radius: 50%` a elementos altos o rectangulares: produce elipses y
  recorta el icono.
- Escala maxima 1.03 en cards; 1.0 en filas y paneles. Evitar escalas que
  recorten el foco dentro de contenedores con `overflow: hidden`.
- Nunca depender solo del color; el foco debe distinguirse con forma, contraste
  o elevacion.
- No animar `filter`, `backdrop-filter`, sombras grandes ni `width/height` al
  enfocar.
- El foco del rail se muestra como pill de cristal rojo + texto blanco.
- El foco de canal live se muestra como fila con gradiente rojo y anillo.
- El foco de categorias fullscreen se muestra como pill con anillo interior;
  no como rectangulo.

### 5.2 Topologia y comportamiento

- Se conserva el orden espacial actual: rail a la izquierda, contenido a la
  derecha, utilidades arriba, lista live a la derecha.
- No se reordenan focusables ni se eliminan destinos de navegacion.
- Cualquier cambio de geometria debe validar que el movimiento direccional
  siga eligiendo el vecino correcto en las cuatro direcciones.
- Los overlays live mantienen su propio confinamiento de foco.
- Las cargas asincronas no deben robar el foco. Si una lista se vuelve a
  renderizar, conservar el indice/fila enfocada.
- Al cerrar un overlay, restaurar el foco al control que lo abrio.
- En Home/TV, BACK enfoca primero el menu lateral; solo sale de la app si el
  foco ya esta en las tabs.
- En player, BACK cierra en orden: seek, categorias, episodios, ajustes,
  canales, infobar y finalmente vuelve a la pantalla anterior.
- El foco debe quedar completamente visible dentro del contenedor con scroll.

### 5.3 Checklist antes de dar por terminada una pantalla

1. El foco se ve claramente a distancia de TV, sobre fondo claro y oscuro.
2. Se recorren todos los destinos con las cuatro direcciones sin saltos.
3. Ningun re-render asincrono pierde ni duplica el foco.
4. Las filas, pills y circulos tienen foco con la misma forma del componente.
5. BACK respeta overlays, menu lateral y salida de la app.
6. El scroll deja el foco completo dentro del area visible.
7. Sin `outline` cuadrado, sin recortes y sin sombras costosas.
8. Validado en TV fisica con control remoto, no solo en web.

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

### 7.4 Detalle de serie minimalista

Objetivo: reducir ruido visual y acercar la ficha de serie al patron de los
sitios de streaming actuales, sin cambiar datos ni navegacion funcional.

Composicion propuesta:

- Backdrop cinematografico a pantalla completa.
- Poster compacto 230x345 en x80, y140.
- Preview de video 720x405 en x1080, y140. Se conserva en runtime para no
  perder la funcion existente de preview.
- Ficha en x350, ancho 680: titulo, score, linea de año/temporadas/episodios,
  pills de metadatos, sinopsis de 2-3 lineas y acciones.
- Acciones: `Favorito`, `Recordatorios`, `Pantalla completa` y `Ajustes`.
  No hay boton `Reproducir`: la reproduccion se inicia desde la card de
  episodio. Idioma y fluidez dejan de ser botones independientes; pantalla
  completa se conserva como acceso directo.
- Se elimina la seccion "Quizas te guste" del detalle de serie.
- Episodios full-width en x80, y610, ancho 1760.

Episodios tipo streaming:

- Carril horizontal de 6 cards de 280x270.
- Still 16:9 de 280x158, badge de numero, titulo, duracion/calidad y
  descripcion de dos lineas. El progreso por episodio queda para una fase
  posterior porque el detalle actual no expone ese dato.
- El selector de temporada se muestra junto a la leyenda "Episodios"; el
  contador de episodios queda al extremo derecho del encabezado.
- Se conservan los bloques de 20 episodios como paginacion tecnica para no
  renderizar 129 cards de golpe. Los rangos pasan a ser navegacion secundaria.
- La card completa es el foco; el badge de numero no altera el layout al
  enfocar.
- Las imagenes vienen de TVMaze con fallback a la imagen de la serie. Ver
  `docs/EPISODE_ARTWORK.md`.

Transicion de temporada:

1. El foco permanece en el selector de temporada al confirmar el cambio.
2. Se muestran skeletons de cards durante la carga; no se vacia el layout.
3. Al llegar los datos, crossfade/slide de 180 ms y actualizacion del contador.
4. El bloque de rangos vuelve al primero de la nueva temporada.
5. Si el foco estaba dentro de los episodios, se restaura en el primer episodio;
   si estaba en la temporada, no se roba el foco.
6. Si la carga falla, se conserva la temporada anterior y se informa con toast.
7. Al volver del reproductor se conserva temporada, bloque y episodio activo.
8. No se reinicia el scroll de la pagina; solo se desplaza el carril de
   episodios al inicio.

Orden de foco propuesto: temporada -> rangos -> primer episodio -> resto de
cards -> acciones superiores. BACK vuelve a la pantalla anterior sin abrir
paneles intermedios.

### 7.5 Detalle de pelicula minimalista

La propuesta incluye dos variantes de pelicula para comparar:

- Referencia: poster, ficha tecnica, still de vista previa y recomendaciones
  verticales.
- Minimalista: conserva poster, preview del video y "Quizas te guste", pero
  reduce la ficha y cambia las recomendaciones al formato de card de episodio.

Variante minimalista:

- Backdrop full-bleed, poster compacto 230x345 en x80, y140 y preview 720x405
  en x1080, y140.
- Ficha en x350, ancho 680: titulo 52 px, score, metadatos, sinopsis de dos
  lineas y acciones.
- Acciones: `Favorito`, `Recordatorios`, `Pantalla completa` y `Ajustes`.
  No hay boton `Reproducir`: el preview del video es el punto de inicio; el
  poster es referencia visual.
- Director y reparto en dos lineas compactas; sin filas de ficha tecnica.
- "Quizas te guste" se presenta como carril full-width de 6 cards 16:9 en
  y610, usando el mismo componente visual que los episodios.
- El foco inicial queda en `Favorito`; `Ajustes` abre el panel de
  configuracion sin sacar al usuario de la ficha.

Consolidacion de ajustes:

- Idioma y fluidez salen de la ficha de detalle.
- Se encapsulan en un icono de ajustes con dos selects:
  - Idioma: Español / Original.
  - Fluidez: Normal / Fluido.
- El mismo panel debe existir en pantalla completa. El detalle solo muestra el
  icono y el resumen; no duplica controles en la accion principal.
- La reproduccion se inicia desde la card de episodio en series y desde el
  preview en peliculas; no hay boton `Reproducir` en las pantallas rediseñadas.

## 8. Componentes reutilizables

| Componente | Variantes | Notas |
|---|---|---|
| `AppTopBar` | Home, Live, Simple | Cristal, marca, utilidades |
| `NavRail` | Expandido, Colapsado | 7 tabs, icono+label, foco |
| `GlassPanel` | Soft, Normal, Strong | Un solo blur por panel |
| `HeroStage` | VOD, Live | Imagen/video + gradiente + metadata |
| `MediaCard` | Vertical, Horizontal, Continue | Sin blur; foco con anillo |
| `ContentRow` | Scroll horizontal | Titulo + cards; sin Grid |
| `DetailHero` | Reference, Minimal | Poster/backdrop + ficha corta |
| `EpisodeRail` | Scroll horizontal | 6 cards de 280x270; sin Grid ni gap |
| `EpisodeCard` | Normal, Focused, InProgress | Still 16:9, numero, progreso |
| `SeasonSelect` | Normal, Focused, Open | Temporada + bloques; transicion |
| `SettingsPopover` | Closed, Open | Idioma y fluidez en dos selects |
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

- `docs/proposals/home-live-glass.html`: Home y TV en vivo.
- `docs/proposals/detailts-catalog-glass.html`: detalle de pelicula y serie,
  con referencia, serie minimalista y variante minimalista de pelicula.

Son artefactos estaticos de revision. No se cargan desde la app, no importan
`app.js` y no modifican el runtime. Muestran las pantallas a 1920x1080 con
tokens, foco, cristal y fallback.

## 14. Aprobacion y arranque

Estado: aprobado. La Fase A cerro con IPK `1.7.2`, 504 pruebas y validacion en
TV fisica. La implementacion de Fase 7 puede iniciar.

Antes del primer cambio visual:

- leer `docs/ARCHITECTURE.md` y esta seccion 5;
- confirmar que el cambio no toca Core, API, servicio, IDs, claves ni
  empaquetado;
- partir de `1.7.2` y mantener `pnpm check` verde;
- implementar por pantalla/componente, no en un solo bloque;
- validar web y TV antes de continuar con la siguiente pantalla.

## 15. Registro de implementacion

### 15.1 Primer corte (2026-11-03)

Alcance aplicado sin cambiar DOM funcional, IDs, datos, navegacion ni
empaquetado:

- `src/webos/app/css/ui-glass.css`: tokens de color, radios, sombras, tipografia
  y movimiento; shell de Home (fondo, barra superior de cristal, marca, rail
  expandido/colapsado, barra de utilidades); foco unico con `box-shadow` para
  rail, cards, posters, preview live, filas de canal y favoritos; overlays de
  categorias y busqueda live.
- `src/webos/app/index.html`: enlace a `ui-glass.css` despues de `style.css` y
  marca visual `.home-brand` (no focusable).
- `scripts/vite-legacy-web-plugin.ts`: import de `ui-glass.css` en desarrollo
  para conservar HMR.
- `src/web/server.js`: cache-busting de `ui-glass.css`.

Decisiones tecnicas:

- El rail se superpone al contenido como panel de cristal; conserva la topologia
  de foco actual y colapsa a iconos al entrar al contenido.
- Blur limitado a barra superior y rail. El panel live usa superficie fuerte
  opaca, sin `backdrop-filter`, para respetar el maximo de 2 superficies.
- El foco usa anillo blanco + halo rojo con `box-shadow`; se eliminan los
  `outline`/`border` cuadrados de foco anteriores.
- Sin CSS Grid, `gap`, `aspect-ratio`, `clamp`, `sticky` ni animaciones de
  filtros o sombras grandes.

Validado:

- `pnpm check`: 504 pruebas, 120 archivos.
- `pnpm build:web` y `pnpm build:webos`.
- Smoke del servidor web: `/`, `/css/style.css`, `/css/ui-glass.css` y
  `/js/app.js` responden 200.

### 15.2 Alineacion con el prototipo (2026-11-03)

El primer corte conservo el DOM funcional, pero no reproducia la composicion
del prototipo `docs/proposals/home-live-glass.html`. Se reestructuro solo la
capa de presentacion:

- Home: `homePages.ts` genera un `.home-content` en x160 y16 con hero
  1280x620, side card 416x620, cabecera de fila y cuatro cards de 415x194.
  Se retiro el backdrop de pagina; el fondo lo aporta `#screen-home`.
- Live: `homeLivePage.ts` genera preview 1120x760 en x160 y16, guia 1120x80
  en y794 y panel 560x858 en x1320 y16. El preview queda junto al rail
  colapsado y el rail expandido puede taparlo. Se retiraron el badge EN VIVO,
  las pills de categorias, el fondo de pagina y el frame/logo de preview.
- La cabecera muestra `Favoritos N` y la categoria seleccionada al lado; los
  botones Categorias, Favoritos y Buscar llevan icono y texto.
- `liveList.ts` anade numero, icono, nombre, play y favorito; se retiro el
  subtitulo de categoria por fila.
- `ui-glass.css` fija el rail en x40 w320 y `.home-pages` en y124 h956. La
  guia es visual porque no hay EPG.
- Se preservan IDs, refs runtime, destinos de foco, datos y navegacion.

### 15.3 Ajustes de integracion (2026-11-04)

- Las demas paginas Home usan el mismo `.home-content` en x160, al lado del
  rail colapsado; cuando el rail se expande puede tapar el contenido.
- `lazyPosters` reconoce `.hero`, `.side-card` y `.card`, por lo que las
  imagenes de hero, continuar viendo y cards ya cargan fuera de `.poster`.
- El contenido Home y el preview live bajan 16 px para que el anillo de foco
  de la primera card grande no se recorte contra el borde superior.
- El favorito de canal live pasa a un boton circular de 44x44 con foco
  circular; se elimino el bloque cuadrado de 40x88.

Validado:

- `pnpm check`: 504 pruebas, 120 archivos.
- `pnpm build:web` y `pnpm build:webos`.
- Smoke del servidor web: HTTP 200.

Pendiente:

- revision visual en navegador y TV fisica de la alineacion;
- aplicar el mismo lenguaje a las pantallas fuera de Home;
- validar foco, scroll y rendimiento con control remoto antes de continuar.

### 15.4 Card rotativa y filas secundarias (2026-11-04)

- La card lateral `Destacado` rota automaticamente cada 5 s entre los titulos
  de la pagina, excluyendo el hero. Muestra nombre, calificacion, año/genero y
  poster. Se detiene mientras la card tiene foco y se reanuda al salir; el
  click abre el titulo visible.
- Las paginas filtran primero por categoria estricta (`destacado`, `pelicula`,
  `serie`, `anime`) para evitar que Destacados y Peliculas compartan titulos;
  solo usan el filtro amplio como fallback.
- Las filas secundarias ya no repiten el titulo de la pagina con `· Mas` ni
  muestran `Ver todo`; solo la fila principal conserva `Ver todo`.
- `NUEVO` solo se muestra si el item trae una marca de novedad; ya no se aplica
  a la primera card por posicion.
- Eliminada la superposicion de filas extra en Explorar.

Validado:

- `pnpm check`: 506 pruebas, 120 archivos.
- `pnpm build:web` y `pnpm build:webos`.
- Smoke del servidor web: HTTP 200.

### 15.5 Navegacion vertical y transicion (2026-11-04)

- Al subir desde las cards inferiores, el foco prioriza candidatos dentro del
  mismo `.home-page` antes que las opciones de la barra superior; si no hay
  candidato arriba en la pagina, mantiene el fallback anterior.
- La card `Destacado` anima la entrada de imagen y texto (`sideRotateIn`,
  opacidad + desplazamiento de 10 px) para suavizar el cambio automatico.

### 15.6 Arranque y foco live (2026-11-04)

- El arranque deja el rail colapsado y el foco en el preview de TV/Home; ya no
  se muestra el menu abierto con el foco fuera de el.
- Al recargar la lista live se conserva el foco en la fila o en el corazon de
  favorito, evitando el parpadeo durante la carga inicial de canales.

### 15.7 Caratulas de episodio y detalle minimalista (2026-11-05)

Caratulas de episodio:

- Implementado `src/webos/service/episodeArt.js`: TVMaze por IMDb o titulo,
  cache de 24 h, cola de 500 ms, timeouts y fallback a la imagen de la serie.
- `magis.detail()` enriquece los episodios con `picture`, `still` y
  `pictureFallback`; si TVMaze falla, el detalle sigue funcionando.
- La UI de detalle pinta still 16:9, overlay y numero; se agrego prueba de
  render en `detailScreen.test.ts`.
- Validacion real: `La edad dorada T1` 9/9,
  `Bridgerton T1` 8/8, `Los Tudor T1` 10/10 y `Bridgerton T2` 8/8.
- Detalle tecnico completo en `docs/EPISODE_ARTWORK.md`.

Propuesta de rediseno:

- `docs/proposals/detailts-catalog-glass.html` ahora muestra la serie en una
  variante minimalista: sin "Quizas te guste", poster compacto y episodios
  full-width con cards 16:9 tipo streaming.
- Se documenta la transicion de temporada: skeleton 180 ms, crossfade, reset
  de bloque, restauracion de foco y conservacion de temporada/episodio al
  volver del reproductor.
- Idioma y fluidez se retiran de las acciones de detalle y se agrupan en un
  icono de ajustes con dos selects; el mismo panel se propone para pantalla
  completa.
- Se agrego una variante minimalista de pelicula que conserva poster, preview
  del video y "Quizas te guste" en formato de cards de episodio, con ficha
  breve y acciones reducidas.

Validado:

- `pnpm run typecheck`, `pnpm run lint`, `pnpm run lint:legacy` y
  `pnpm test`: 509 pruebas, 120 archivos.
- `pnpm run build:ui` regenerado.
- `xmllint --html --noout` sobre el prototipo: sin errores.

### 15.8 Detalle minimalista aplicado al runtime (2026-11-05)

- `src/ui/screens/detail/detailScreen.ts` ahora renderiza backdrop, poster
  compacto, ficha reducida, preview 720x405 y acciones en pildoras.
- Serie: elimina "Quizas te guste", muestra encabezado Episodios + Temporada,
  rangos compactos y cards 16:9 con still, numero, titulo, duracion/calidad y
  descripcion.
- Pelicula: conserva poster, preview y "Quizas te guste" con el mismo
  componente de card 16:9.
- Se retiraron los botones Idioma y Modo fluido. `Ajustes` abre un popup con
  acceso al dialogo de idioma y un selector de dos estados Normal/Fluido.
- El foco inicial de una serie queda en el episodio actual (o en el primero
  si aun no hay uno activo); en pelicula queda en la primera accion. BACK
  cierra el popup de Ajustes antes que el de temporada.
- `src/ui/runtime/navigation.ts` y `src/ui/legacy/legacyWiring.js` incorporan
  `hasSettingsPopup`/`closeSettingsPopup`.
- `src/webos/app/css/style.css` define backdrop, poster, ficha, pildoras,
  popup de ajustes, season inline, rangos y cards compartidas.
- `getDetailFocusable` en `legacyStore.js` prioriza el episodio actual
  (`.detail-episode.is-current`), luego el que se esta reproduciendo y, como
  respaldo, el primer episodio.
- Transicion de temporada aplicada: el foco se queda en el selector, se
  muestran 6 cards skeleton con "Cargando episodios…", no se vacia el layout,
  se reinicia el bloque, se anima la entrada con fade/slide de 180 ms y se
  conserva la temporada anterior con toast si la carga falla.
- Cambiar de temporada ya no inicia reproduccion automatica; la preview
  reproduce el primer episodio solo si no hay uno activo.
- Las cargas de temporada usan un token de secuencia para ignorar respuestas
  antiguas y evitar pisar una seleccion mas reciente.
- El popup de temporadas mantiene el foco dentro de la lista: arriba/abajo
  cambian de temporada con limite en los extremos y los laterales no lo sacan
  del popup. Al abrirlo se desplaza automaticamente hasta la temporada actual y
  la barra de scroll nativa queda oculta.
- Al volver del reproductor o al abrir una serie con progreso, el bloque de
  episodios se sincroniza con el episodio actual, se marca con `is-current` y
  badge "Viendo", y el foco se restaura en esa card.
- El control "Ver sinopsis" es enfocable y activable; abre un panel de lectura
  sobre la ficha y BACK lo cierra antes de salir del detalle. Con el panel
  abierto, arriba/abajo desplazan el texto por lineas para poder leer sinopsis
  largas desde el control remoto; la barra de scroll queda oculta.

Validado:

- `pnpm run lint`, `pnpm run lint:legacy`, `pnpm run typecheck` y
  `pnpm test`: 515 pruebas, 120 archivos.
- `pnpm run build:ui`, `pnpm run build:web` y `pnpm run build:tizen`
  regenerados; ver `docs/SAMSUNG_TIZEN.md`.
- En Tizen/TV se conservan las caratulas ya cargadas y se evita el escalado al
  mover el foco para reducir parpadeos; BACK del mando Samsung (`10009`) esta
  mapeado y en la raiz usa la API de salida de Tizen.

Pendiente:

- revision visual en navegador y TV fisica de la alineacion;
- validar en TV la animacion real de skeleton/crossfade;
- definir la atribucion visible a TVMaze (CC BY-SA);
- aplicar el mismo lenguaje a las pantallas fuera de Home y detalle;
- probar el `.wgt` firmado en una TV Samsung real y, si un titulo no reproduce,
  implementar el adaptador AVPlay.
