# TutyTV - Caratulas de episodios con TVMaze

Fecha: 2026-11-05

Estado: implementado en servicio y detalle. Pendiente validacion en TV fisica y
definir la atribucion visible a TVMaze.

## 1. Problema

El detalle de serie necesitaba caratulas por episodio para construir cards tipo
streaming. La API del portal no entrega imagenes de episodio:

- `assetData.simpleProgramList` no incluye `picture`, `pic`, `image`, `cover`,
  `posterUrl` ni `poster`.
- `posterList` de cada episodio viene vacio en las pruebas realizadas.
- `v4/getItemData` con el `contentId` de un episodio falla con
  `portal100006 剧集不存在`.
- `v10/startPlayVOD` devuelve `episodeList` sin campos de imagen.

La serie si entrega `posterList` con variantes `icon`, `poster` y `stage`, y
`assetData.keyWords` contiene el IMDb ID cuando esta disponible.

## 2. Solucion

Se agrego un enriquecimiento opcional con TVMaze en
`src/webos/service/episodeArt.js`.

Flujo:

1. `magis.detail()` construye episodios y temporadas como antes.
2. Si hay episodios, llama a `episodeArt.enrichEpisodes()` con:
   - `imdb`: `assetData.keyWords`.
   - `title`: `assetData.alias || assetData.name`.
   - `season`: temporada actual detectada en `sameSeasonSeriesList`.
   - `episodes`: lista ya normalizada del portal.
   - `fallback`: `backdrop`, `landscape` o `poster` de la serie.
3. TVMaze resuelve el show por IMDb; si no hay IMDb, usa busqueda por titulo
   limpiando sufijos `S1`, `T1`, `Temp.1` y `Temporada 1`.
4. Se solicitan los episodios con `embed=episodes`.
5. Se asigna una imagen por episodio y se devuelve el detalle aunque TVMaze
   falle.

## 3. Contrato de episodio

Cada episodio puede recibir:

| Campo | Uso |
|---|---|
| `picture` | URL final para la card del detalle. |
| `still` | Still de TVMaze, vacio si no hubo coincidencia. |
| `pictureFallback` | `true` si se uso la imagen de la serie o una imagen previa. |

La UI usa `picture`; `still` y `pictureFallback` quedan disponibles para
diagnostico o para una futura insignia visual.

## 4. Mapeo de temporada y episodio

- La temporada actual se obtiene buscando en `sameSeasonSeriesList` el
  `contentId` que coincide con el detalle abierto.
- Si no hay coincidencia, se intenta inferir desde el sufijo del titulo
  (`S2`, `T2`, `Temp.2`, `Temporada 2`).
- El numero de episodio usa `seriesNumber` del portal.
- Primero se busca coincidencia exacta `temporada + numero`.
- Si no existe, se usa el indice dentro del bloque solo cuando el tamano del
  bloque de TVMaze coincide con la cantidad de episodios del portal.
- No se adivina una temporada distinta cuando los conteos no coinciden; en ese
  caso se aplica el fallback de imagen de serie. Esto evita asignar stills de
  una temporada incorrecta.

## 5. Cache, red y limites

- Cache en memoria de 24 horas para show y episodios.
- Deduplicacion de peticiones en vuelo por URL.
- Cola serial con 500 ms entre llamadas para respetar el limite orientativo de
  TVMaze de 20 llamadas cada 10 segundos.
- Timeout por peticion: 2 segundos.
- Timeout total del enriquecimiento: 6 segundos.
- Poda de cache al superar 300 entradas.
- Si TVMaze devuelve 404, se guarda cache negativa para no repetir la busqueda.
- Cualquier error de red, timeout o respuesta invalida deja el detalle
  funcional con la imagen de serie como fallback.

## 6. Archivos

- `src/webos/service/episodeArt.js`: lookup, cache, cola, mapeo y fallback.
- `src/webos/service/magis.js`: integracion en `detail()`.
- `src/ui/screens/detail/detailScreen.ts`: campos de imagen y render del thumb.
- `src/webos/app/css/style.css`: estilos de la card con still y overlay.
- `src/ui/screens/detail/detailScreen.test.ts`: prueba de render de thumbnail.
- `src/webos/app/js/tuty-ui.js`: artefacto regenerado con `pnpm build:ui`.

Propuesta visual asociada:

- `docs/proposals/detailts-catalog-glass.html`: cards de episodio 16:9,
  detalle de serie minimalista y variante minimalista de pelicula.
- La transicion de temporada y la consolidacion de Idioma/Fluidez en Ajustes se
  documentan en `docs/UI_REDESIGN.md`, secciones 7.4 y 7.5.

## 7. Validacion

Pruebas de API:

- `posterList` vacio en 2200 episodios de 60 series.
- 150 assets revisados; la cobertura de TVMaze es alta en series mainstream y
  presenta huecos en telenovelas, series antiguas y algunos titulos de anime.
- Prueba inicial: 12/12 series y 98/98 episodios con still.
- Detalle real del portal: `La edad dorada T1` 9/9, `Bridgerton T1` 8/8 y
  `Los Tudor T1` 10/10 con still.
- `Bridgerton T2` mapeo correctamente 8/8 episodios de la temporada 2.
- Se observaron timeouts de red durante las pruebas; el fallback mantuvo el
  detalle funcional.

Pruebas del proyecto:

- `pnpm run typecheck`: OK.
- `pnpm run lint`: OK.
- `pnpm run lint:legacy`: OK.
- `pnpm test`: 509 pruebas, 120 archivos.
- `pnpm run build:ui`: OK.

## 8. Limitaciones y pendientes

- TVMaze no tiene stills para todas las series; el fallback a la imagen de la
  serie es obligatorio.
- Los titulos sin IMDb dependen de la busqueda por nombre y pueden requerir
  revision manual.
- La primera carga de un titulo sin cache puede agregar entre 0.7 y 2.2 segundos
  al detalle; las cargas siguientes usan cache.
- Validar en TV fisica que las imagenes HTTPS de `static.tvmaze.com` carguen
  correctamente en webOS 4.
- Evaluar una cache persistente o prefetch si el uso real muestra latencia.
- Opcional: reutilizar `picture` en el navegador de episodios del reproductor.

## 9. Licencia

TVMaze publica sus datos bajo CC BY-SA 4.0 y solicita atribucion. Antes de
distribuir el IPK hay que definir donde se muestra la atribucion visible:
pantalla de ajustes/acerca de, pie del detalle o credits del reproductor.
