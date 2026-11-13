# TutyTV en Samsung TV (Tizen)

Esta guía genera un paquete `.wgt` para TVs Samsung con Tizen y explica cómo
firmarlo e instalarlo en modo desarrollador. La app Tizen carga su interfaz
desde el paquete local y usa el portal directamente, sin PC: AVPlay para VOD
directo y `hls.js`/MSE para el vivo con headers.

## Requisitos

- TV Samsung de 2018 o posterior, con Tizen 4.0 o superior.
- TV y PC conectados a la misma red local (solo para instalar por `sdb`).
- Tizen Studio con las extensiones de TV, `tizen` y `sdb` disponibles.
- Cuenta Samsung para crear el certificado de desarrollador.
- Solo para recompilar: Node.js 20 o superior y `pnpm`.

## Instalación rápida (recomendada)

1. Activa el **Modo Desarrollador** en la TV y registra la IP del PC (paso 3).
2. En el PC, desde la raíz del repositorio:

   ```bash
   chmod +x INSTALAR-TUTYTV-TIZEN.sh
   ./INSTALAR-TUTYTV-TIZEN.sh
   ```

3. Escribe la IP del televisor cuando la pida.

El script compila la app si `pnpm` está disponible, firma con el perfil activo de
Tizen Studio, conecta por `sdb`, instala el `.wgt` y abre TutyTV. También guarda
la última IP y el perfil en `instalar-config-tizen.json`.

Opciones útiles:

```bash
./INSTALAR-TUTYTV-TIZEN.sh --host 192.168.1.50 --profile tuty
./INSTALAR-TUTYTV-TIZEN.sh --rebuild
./INSTALAR-TUTYTV-TIZEN.sh --dry-run
```

`--dry-run` comprueba herramientas, proyecto, IP y perfil sin firmar ni tocar la
TV. `--no-build` usa la build existente en `dist/tizen`.

## 1. Backend opcional (desarrollo)

La build Tizen usa el portal directo por defecto y no necesita este backend.
Solo lo necesitas si quieres desarrollar la versión web o forzar un proxy local:

```bash
pnpm install
pnpm run build:web
node src/web/server.js --host=0.0.0.0 --port=8910
```

El servidor debe escuchar en `0.0.0.0`, no en `127.0.0.1`, para que la TV pueda
acceder. Comprueba primero desde el navegador de otro equipo de la red:

```text
http://IP_DEL_PC:8910/
```

Y comprueba la API:

```bash
curl http://IP_DEL_PC:8910/home
```

Si el sistema tiene firewall, abre el puerto:

```bash
sudo ufw allow 8910/tcp
```

En Fedora/Arch con `firewalld`:

```bash
sudo firewall-cmd --add-port=8910/tcp
```

Usa preferiblemente `http://IP_LAN:8910`. Un HTTPS con certificado autofirmado
puede ser rechazado por el navegador de la TV.

## Opción sin PC: Cloudflare Worker

Para no depender de la PC encendida, despliega el proxy serverless de `worker/`:

1. Sigue `worker/README.md` (pegar `worker/dist/worker.js` en el dashboard y
   activar el flag `nodejs_compat`).
2. Compila la app apuntando al Worker:

   ```bash
   pnpm run build:tizen -- --service-url https://<worker>.workers.dev
   ```

3. Firma e instala como en las secciones siguientes.

El Worker no transcodifica: reproduce la pista original (H.265/HEVC incluido).
Samsung Tizen lo decodifica; Chrome de PC no, así que en PC sigue usando el
backend Node con ffmpeg.

## 2. Generar el paquete WGT

Por defecto la app usa el portal directo:

```bash
pnpm run build:tizen
```

Solo si quieres apuntar a un backend o Worker concreto, indica la URL que verá
la TV. No uses `127.0.0.1`: dentro de la TV ese `127.0.0.1` es la propia TV.

```bash
pnpm run build:tizen --service-url=http://192.168.1.10:8910
```

El resultado queda en:

```text
dist/TutyTV_1.7.3.wgt
dist/tizen/
```

`dist/tizen/` es el proyecto sin firmar. El `.wgt` generado tampoco está firmado:
sirve para revisión local, pero una TV retail normalmente exige firma Samsung.

## 3. Activar modo desarrollador en la TV

1. En la TV, abre **Apps**.
2. Entra en el menú oculto escribiendo `12345` con el mando.
3. Activa **Developer mode**.
4. Introduce la IP del PC donde ejecutarás Tizen Studio/`sdb`.
5. Reinicia la TV.
6. Conecta el PC a la TV:

```bash
sdb connect IP_DE_LA_TV:26101
sdb devices
```

La TV debe aparecer en estado `device`. Si no aparece, revisa que el modo
desarrollador esté activo y que PC y TV estén en la misma red.

## 4. Crear el certificado Samsung

En Tizen Studio:

1. Abre **Certificate Manager**.
2. Crea un certificado **Samsung** de tipo author.
3. Inicia sesión con la cuenta Samsung.
4. Asocia el certificado a la TV mediante el flujo que solicita Tizen Studio.
5. Anota el nombre del perfil, por ejemplo `TutyTV`.

La firma es obligatoria para instalar en TVs retail. Sin certificado Samsung,
la TV rechaza el paquete con un error de firma o de privilegios.

## 5. Firmar el WGT

`INSTALAR-TUTYTV-TIZEN.sh` hace este paso automáticamente. Para hacerlo a mano,
desde la raíz del repositorio:

```bash
mkdir -p dist/signed
tizen package -t wgt -s TutyTV -o dist/signed -- dist/tizen
ls -lh dist/signed
```

El nombre exacto del archivo firmado puede variar. Usa el `.wgt` que aparezca en
`dist/signed/`.

## 6. Instalar en la TV

`INSTALAR-TUTYTV-TIZEN.sh` también instala y abre la app. Para hacerlo a mano,
con la TV conectada por `sdb`:

```bash
tizen install -n "$PWD/dist/signed/ARCHIVO_FIRMADO.wgt" -s IP_DE_LA_TV:26101
```

Usa `tizen install`, no `sdb install`: en varias TVs `sdb install` solo copia el
archivo, responde `0` y no muestra si el paquete quedó instalado.

Al terminar, abre **TutyTV** desde la lista de apps de la TV.

## 7. Actualizar la app

Vuelve a ejecutar el instalador:

```bash
./INSTALAR-TUTYTV-TIZEN.sh
```

El script firma e instala la nueva versión. Si la TV conserva una versión
anterior y aparece `Author certificate not match`, desinstala primero usando el
ID de la aplicación:

```bash
tizen uninstall -p TutyTV2027.TutyTV -s IP_DE_LA_TV:26101
```

Si aparece `install failed[118, -22]`, la TV dejó una entrada bloqueada con ese
ID de paquete. Genera un paquete con otro ID y vuelve a firmar:

```bash
pnpm run build:tizen -- --package-id TutyTV2028
```

## Notas de compatibilidad

- La build Tizen activa un modo de rendimiento que evita escalar las carátulas
  al mover el foco. Esto reduce el parpadeo típico de Chromium en TV.
- Las carátulas ya cargadas no se descargan al salir del viewport; se conservan
  para evitar recargas visibles al navegar.
- El VOD directo usa AVPlay (`application/avplayer`) para aprovechar el
  decodificador nativo, incluido H.265/HEVC. El vivo usa `hls.js`/MSE porque el
  CDN exige los headers `Content-Auth` y `Content-License`, que AVPlay no puede
  enviar.
- El instalador firma con un perfil de Tizen Studio. Si el certificado Samsung
  caducó o la TV no está asociada a la cuenta, la firma o la instalación fallan.
- El menú BACK del mando Samsung (`keyCode 10009`) ya está mapeado. En la raíz
  de la app solicita la salida mediante la API de Tizen.
- No se puede usar Luna ni el servicio `magis.js` de webOS dentro de Tizen. La
  app ejecuta la lógica del portal en el navegador de la TV mediante
  `js/tuty-portal.js`, sin PC ni Cloudflare.
