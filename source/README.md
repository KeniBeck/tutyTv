# XuperTV 1.6.5 - codigo base

Este arbol contiene la aplicacion webOS y el servicio que usa el IPK, ya
legibles (no minificados), mas una version web local.

Documentacion tecnica y de configuracion: [DOCUMENTACION.md](DOCUMENTACION.md).

## Estructura

```
source/
  usr/palm/applications/com.webosflux.xuptertv.fidelity/   interfaz webOS
  usr/palm/services/com.webosflux.xuptertv.fidelity.service/ servicio Luna
  control, debian-binary                                    metadatos del IPK
  tools/build-ipk.sh                                        generador de IPK
  web/server.js                                             servidor web local
  web/hls.min.js                                            reproductor HLS para escritorio
  web/start.sh / web/start.bat                              lanzadores Linux / Windows
```

## Generar un IPK

Requisitos: `ar`, `tar`, `sed`, `du`, `awk` (Linux/WSL).

```bash
cd source
./tools/build-ipk.sh                 # mantiene la version actual
./tools/build-ipk.sh 1.6.6           # sube la version y compila
./tools/build-ipk.sh 1.6.6 salida.ipk
```

Por defecto el `.ipk` se guarda en la carpeta padre de `source/`, junto a
`INSTALAR-XUPERTV.sh`. Para instalarlo en la TV usa ese instalador.

## Version web local (Linux/Windows)

Solo necesita Node.js 18 o superior. No usa Flutter, Electron ni navegador
empaquetado: abre la app en el navegador normal.

Linux:

```bash
cd source/web
./start.sh
```

Windows: doble clic en `start.bat`.

Tambien hay lanzadores en la carpeta principal del proyecto:
`XUPER-WEB.sh` (Linux) y `XUPER-WEB.bat` (Windows).

Luego abre `http://127.0.0.1:8910/`. El servidor sirve la interfaz, habla con
el portal y sirve el proxy de video. El puerto se puede cambiar:

```bash
./start.sh 9000
```

## Notas

- En la TV se usa el HLS nativo de webOS. En escritorio se usa `hls.min.js`
  porque Chrome/Firefox no reproducen `.m3u8` de forma nativa.
- El portal entrega casi todo el VOD en H.265/HEVC. La web necesita `ffmpeg`
  instalado para transcodificarlo a H.264/AAC; en Arch:
  `sudo pacman -S ffmpeg`. En Windows instala ffmpeg y añádelo al PATH.
  Sin ffmpeg, los canales en vivo y el VOD H.264 se ven, pero el VOD H.265
  muestra un error claro.
- El portal actual no trae EPG, por eso los recordatorios implementados son
  de series (episodios nuevos), no de programas en vivo.
- La version web y la version webOS comparten `js/app.js`. El bloque de HLS
  con `hls.min.js` solo se activa en navegadores de escritorio.
- En la web el "Modo fluido" de la TV no usa ffmpeg: el servidor lo trata como
  reproduccion normal por HLS, para no depender de un ffmpeg del sistema.
