# Documentacion tecnica - XuperTV 1.6.5

## 1. Resumen

XuperTV es una aplicacion web (HTML/CSS/JS) empaquetada como IPK para LG
webOS. No hay codigo nativo: la TV ejecuta una app web y un servicio Node.js
(Luna). La misma interfaz se puede servir en Linux/Windows mediante un
servidor web local que implementa los mismos metodos.

## 2. Estructura

```
source/
  usr/palm/applications/com.webosflux.xuptertv.fidelity/
    index.html, css/style.css, js/app.js
    config/api.js, data/portal.js, data/catalog.js
  usr/palm/services/com.webosflux.xuptertv.fidelity.service/
    index.js            registro de metodos Luna
    magis.js            cliente del portal (peliculas, series, vivo)
    proxy.js            proxy de media, HLS virtual y CORS
    ffmpeg-relay.js     relay "Modo fluido" de la TV (ffmpeg ARM)
    ffmpeg              binario ffmpeg para webOS (755)
  control, debian-binary
  tools/build-ipk.sh
  web/server.js         servidor web local
  web/ffmpeg-web.js     transcodificador H.265 -> H.264 para escritorio
  web/hls.min.js        HLS para navegadores de escritorio
  web/start.sh|start.bat
```

## 3. Arquitectura

- **Frontend**: `js/app.js` maneja navegacion por foco, catalogo, busqueda,
  detalle, historial, favoritos, recordatorios, filtros y reproductor.
  `config/api.js` configura el modo (`portal`), el serviceId y la URL del
  servicio de desarrollo.
- **TV webOS**: `q()` llama a `luna://com.webosflux.xuptertv.fidelity.service`.
  `index.js` registra los metodos y usa `magis.js` para el portal y `proxy.js`
  para el video. El modo fluido usa `ffmpeg-relay.js` en el puerto 8787.
- **Web local**: `web/server.js` expone los mismos metodos por HTTP y sirve
  los archivos de la app. El HTML servido inyecta `window.XUPERTV_WEB=true`,
  `hls.min.js` y `devServiceUrl = location.origin`. Para VOD H.265 usa
  `web/ffmpeg-web.js` (puerto 8787) y lo transcodifica a H.264/AAC.

Flujo resumido:

```
Frontend -> q(metodo, params)
  TV  -> Luna service -> magis.js -> portal Magis
  Web -> server.js    -> magis.js -> portal Magis

Video -> resolve/resolveSmooth
  normal -> proxy.js (HLS virtual / m3u8)
  fluido -> ffmpeg-relay.js (TV) o ffmpeg-web.js (web)
```

## 4. API del portal Magis

`magis.js` usa:

- Hosts: `osuhk.m3x8o50te.com`, `oogoy.f30c96w8.com`
- Portal: `masnew`
- App: `com.android.msandroid`

| Metodo | Uso |
|---|---|
| `v3/snToken` + `v8/active` | Sesion anonima (sn/token) |
| `getNextColumns` | Filas de inicio y categorias de canales |
| `v3/searchByName` | Busqueda de peliculas/series |
| `v4/getItemData` | Detalle de un titulo |
| `v10/startPlayVOD` | Pistas de video/audio y licencia VOD |
| `v14/getSlbInfo` | CDN para VOD y vivo |
| `v6/getLiveData` | Lista de canales en vivo |
| `v4/startPlayLive` | Licencia y direcciones del canal |

Raices de inicio (`ROOT_CODES`): `masnew_featured`, `masnew_movies`,
`masnew_series`, `masnew_anime`, `masnew_kids`, `masnew_free`.
Las categorias de vivo usan `columnCode: "masnew_live"`.

## 5. Servicio Luna (TV)

Metodos registrados en `service/index.js`:

- `ping`, `keepAlive`, `heartbeat`, `prewarm`
- `home`, `search`, `detail`
- `resolve`, `resolveSmooth`, `mediaInfo`
- `liveChannels`, `liveCategories`, `fetchM3u`, `resolveLive`
- `abortMedia`

Respuesta estandar: `{ returnValue: true, ... }` o
`{ returnValue: false, errorText }`. El proxy de media usa tokens y rutas
`/media/<token>/stream.m3u8|stream.mp4|stream.ts`; subtitulos en `/sub/<token>.srt`.

## 6. Version web local

```bash
./XUPER-WEB.sh              # Linux
XUPER-WEB.bat               # Windows
```

Por defecto escucha en `http://127.0.0.1:8910/`. Parametros:

- `PORT` o primer argumento: puerto HTTP.
- `HOST`: interfaz (por defecto `127.0.0.1`).
- `FFMPEG`: ruta al ffmpeg del sistema.
- `NEXTFFMPEG_PORT`: puerto del relay de transcodificacion (por defecto 8787).

Endpoints HTTP: `/home`, `/search`, `/detail`, `/resolve`, `/resolveSmooth`,
`/mediaInfo`, `/liveChannels`, `/liveCategories`, `/fetchM3u`, `/resolveLive`,
`/abortMedia`, `/ping`, `/keepAlive`, `/heartbeat`, `/prewarm`.

La web necesita `ffmpeg` para el VOD H.265. Sin ffmpeg, el VOD H.265 muestra
un error claro; los canales y el VOD H.264 siguen funcionando.

## 7. Persistencia e historial

`localStorage`:

- `xuper_local_profile_v1`: `{ id, createdAt, history[], favs{}, reminders{} }`
- `xuper_global_playback_v1`: preferencias globales de reproduccion.

Entrada de historial:

```json
{
  "id": "id-del-titulo",
  "title": "Titulo",
  "poster": "url",
  "series": false,
  "episodeId": "",
  "episodeNumber": "",
  "position": 120,
  "duration": 3600,
  "updatedAt": 0
}
```

Flujo de reanudacion:

1. Al abrir detalle, `findHistory(item)` busca la entrada por id.
2. `startDetail()` decide si mostrar el dialogo "Continuar viendo".
3. `askResume()` ofrece "Continuar desde HH:MM:SS" o "Empezar desde cero".
4. La eleccion guarda la posicion en `j.resumePosition`.
5. `or()` fuerza `resolveSmooth` para reanudar. Si la URL es del relay
   `:8787/s/`, agrega `?start=<segundos>`.
6. `rr()` aplica `currentTime` cuando la fuente es HLS/MP4 normal y no relay.
7. `Ta()` guarda la posicion cada 15 s, al pausar y al salir del reproductor.
8. La posicion solo se descarta por cambio de episodio cuando el titulo tiene
   mas de un episodio, el episodio guardado sigue existiendo y es distinto al
   actual. En peliculas o titulos de un solo episodio se usa la posicion
   guardada aunque el `episodeId` haya cambiado.
9. Los botones de episodio del panel de detalle llaman a `gn()`, que inicia
   el episodio en el mini reproductor y guarda historial con `playerMode=vod`.
   La vista de detalle se reconstruye con los episodios aunque el modal de
   reanudar ya se haya mostrado.
10. El modal ignora OK/Enter durante 300 ms despues de abrirse para evitar
    dobles pulsaciones o repeticion de tecla. Abrir el mismo detalle dos veces
    mientras el modal esta activo no lo reinicia ni inicia reproduccion.
11. En la web, los MP4/relay usan solo `src` (sin `<source>` duplicado) y el
    relay tolera peticiones duplicadas del mismo token/start para evitar 502.
12. La fila "Quizas te guste" del detalle (`detail-grid`) es un carrusel
    horizontal: `overflow-x: auto` + `scrollable` para que `et()` desplace la
    fila al mover el foco. Se generan 16 sugerencias para que haya contenido
    desplazable. La barra de rangos de episodios (`detail-ranges`) usa el mismo
    mecanismo. El alto del carrusel se deja en 380 px para que `et()` no haga
    scroll vertical sobre los posters.
13. `startDetail()` comprueba que exista historial antes de leer
    `hist.episodeId`, de modo que abrir una serie sin historial ya no lanza un
    error al arrancar el mini reproductor.
14. `et()` corrige la escala de `#app`: `getBoundingClientRect()` devuelve
    pixeles de pantalla (ya escalados) mientras `scrollLeft/scrollTop` van en
    pixeles de layout. Sin dividir por la escala, en la web el carrusel se
    quedaba a medio recorrer y habia que pulsar varias veces para ver el
    primer/ultimo poster completo. En la TV con escala 1 no cambia nada.
15. La pantalla de bienvenida ya no reproduce los 16 PNG del loader: usa un
    spinner CSS (`.welcome-spinner`). El fondo `tutyTV_fondo.webp` lleva una
    capa negra al 35 % (`#screen-welcome::before`) para bajar el brillo sin
    ocultar la imagen.
16. La pestana TV tiene un menu de vivo completo. Las tres funciones viven en
    `#live-btn-all` (categorias), `#live-btn-fav` (favoritos) y
    `#live-btn-srch` (buscar), sobre la columna derecha de canales. La tecla
    Menu (457/93/467) abre el selector de categorias desde el video. El
    selector `#live-categories` pinta las 38 columnas del portal con
    `getLiveCategories` y carga cada una con `liveChannels`/`columnId`
    (`Ut()` -> `Bt()`). La busqueda `#live-search` reutiliza el teclado en
    pantalla y filtra los canales de la categoria actual (tambien encuentra
    categorias por nombre). `#live-cat-label` muestra categoria y numero de
    canales. Los favoritos usan `j.favs` con clave `live:<channelCode>` y se
    guardan en `xuper_local_profile_v1`; el boton "Favorito" del reproductor
    usa `liveToggleFav()`. Al paginar (`Bt()` carga de 20 en 20), `Ht()`
    conserva el foco de la fila para que la lista no lo pierda.

Si se cambia el formato del historial, hay que actualizar `findHistory`,
`Ta`, `qa` y la vista `Si()`.

## 8. Configuracion

- `config/api.js`: `enabled`, `mode` (`portal`), `serviceId`, `refresh`,
  `devServiceUrl`, `session`, `timeoutMs`.
- `magis.js`: `HOSTS`, `PORTAL_CODE`, `APP_ID`, `APK_VERSION`, `SPKG_VER`,
  `ROOT_CODES`, claves de cifrado.
- `build-ipk.sh` actualiza version en `appinfo.json`, `packageinfo.json`,
  `control`, `service/package.json` e `index.html`.
- `proxy.js`: proxy HTTP aleatorio; CORS habilitado; HLS virtual para `.ts`.
- `ffmpeg-relay.js` (TV) y `ffmpeg-web.js` (web): puerto 8787.

## 9. Flujo para hacer un cambio

1. Editar archivos en `source/`.
2. Si es cambio de interfaz/servicio, probar en web:
   detener y volver a iniciar `./XUPER-WEB.sh`; recargar con Ctrl+Shift+R.
3. Verificar sintaxis:
   `node --check` en los JS y `bash -n` en los scripts.
4. Si el cambio tambien va para la TV, generar IPK:
   `cd source && ./tools/build-ipk.sh 1.6.6`
   El IPK sale en la carpeta padre. Instalar con `INSTALAR-XUPERTV.sh`.
5. Si solo cambia `source/web/`, no hace falta regenerar el IPK.

## 10. Pruebas recomendadas

- `./INSTALAR-XUPERTV.sh --dry-run --host IP --user prisoner`
- Web: inicio, buscador, filtro, detalle, historial, reanudar, canales.
- Detalle de pelicula y de serie: bajar a "Quizas te guste" y recorrer las 16
  sugerencias con flecha derecha; la fila debe desplazarse y mostrar las que
  quedan fuera de pantalla.
- TV en vivo (home): boton de categorias, elegir "Deportes"/"Vivo gratis",
  comprobar que la lista y la etiqueta cambian; abrir buscar, escribir con el
  teclado en pantalla y abrir un resultado; activar favoritos tras marcar un
  canal con "Favorito" en el reproductor. La tecla Menu abre categorias y
  Back cierra los paneles.
- Relay web: resolver un titulo H.265 y comprobar cabecera `video/mp4`;
  con `ffprobe` debe salir `h264` + `aac`.
- TV: instalar IPK, abrir app, reproducir VOD, canal en vivo, pausar,
  salir, volver al historial y comprobar "Continuar desde...".

## 11. Problemas comunes

- **VOD negro/cargando en web**: falta ffmpeg o el puerto 8787 esta ocupado.
- **VOD H.265 no soportado**: el navegador no decodifica HEVC; usar el relay
  de transcodificacion.
- **Cambios no visibles**: detener el servidor, reiniciar y hacer Ctrl+Shift+R.
  La consola del navegador debe mostrar `[XuperTV Web] build 1.6.5-r12`;
  si no aparece, se esta cargando una version vieja.
- **TV no instala**: misma red, Modo Desarrollador activo, puerto 9922,
  clave vigente (50 h), KEY SERVER en ON si aplica.
- **Version rechazada**: subir el numero de version en `build-ipk.sh`.

## 12. Restricciones webOS 4

- Chromium 53: mantener JavaScript ES5 (sin `?.`, `??`, `let`/`const` en
  codigo nuevo de la app, sin `gap` en flexbox).
- No romper el HLS nativo de la TV: el codigo exclusivo de web debe ir
  protegido por `window.XUPERTV_WEB` o por la presencia de `window.Hls`.
- No eliminar `ffmpeg` del IPK; debe conservar permisos `755`.
- El IPK se arma con `ar` en orden `debian-binary`, `control.tar.gz`,
  `data.tar.gz` y propietario `0/0`.
