# TutyTV Worker (Cloudflare)

Proxy serverless para que la app Tizen hable con el portal sin la PC encendida.
Reutiliza `src/webos/service/magis.js` (sesión, cifrado 3DES, endpoints) con shims
de `https/http/crypto/url` basados en `fetch` y `crypto-js`.

## Qué hace

- API: `ping`, `keepAlive`, `heartbeat`, `home`, `search`, `detail`,
  `liveChannels`, `liveCategories`, `fetchM3u`, `resolve`, `resolveSmooth`,
  `mediaInfo`, `resolveLive`, `abortMedia`, `prewarm`.
- VOD: genera un HLS virtual por **rangos de bytes** (`#EXT-X-BYTERANGE`) usando
  la duración real calculada con los PTS del MPEG-TS. No transcodifica.
- Segmentos: proxy con soporte de `Range` (206) y CORS.
- Live: descarga el `.m3u8` con los headers del portal, reescribe las URLs de
  segmentos y las sirve por el Worker. Si el CDN responde 401 por rotación de IP,
  vuelve a resolver el canal y reintenta.
- Subtítulos: proxy SRT (`/sub/<token>.srt`).
- VOD y segmentos intentan primero **sin headers** (el CDN los acepta) para
  evitar que el token quede atado a la IP de salida de Cloudflare.

## Compilar

```bash
cd worker
npm install          # crypto-js + esbuild
npm run build        # genera dist/worker.js (minificado)
npm run build:debug  # genera dist/worker.debug.js (sin minificar)
```

## Desplegar

### Opción A: dashboard (sin CLI)

1. Cloudflare Dashboard → Workers & Pages → Create → Worker.
2. Settings → Runtime → **Compatibility flags** → agregar `nodejs_compat`.
3. Edit code → borrar el ejemplo y pegar el contenido de `worker/dist/worker.js`.
4. Deploy. Anota la URL `https://<nombre>.<subdominio>.workers.dev`.

### Opción B: Wrangler

```bash
cd worker
npx wrangler login
npm run deploy
```

`wrangler.toml` ya incluye `compatibility_flags = ["nodejs_compat"]`.

## Apuntar la app Tizen al Worker

```bash
pnpm run build:tizen -- --service-url https://<nombre>.<subdominio>.workers.dev
tizen package -t wgt -s pub2 -o "$PWD/dist/signed" -- "$PWD/dist/tizen"
tizen install -n "$PWD/dist/signed/TutyTV.wgt" -s <IP_TV>:26101
tizen run -p TutyTV2026.TutyTV -s <IP_TV>:26101
```

El build escribe la URL en `dist/tizen/config/api.js` (`devServiceUrl`).

## Notas

- El Worker resuelve la **pista original** (puede ser H.265/HEVC). En Samsung
  Tizen el HLS nativo decodifica HEVC; en Chrome de PC no. Para PC seguir usando
  el backend Node con ffmpeg.
- No hay transcodificación: si el TV no soporta el códec, no hay fallback.
- La app Tizen debe incluir el ajuste de HLS nativo (`prefersNativeTvPlayback`
  con `Tizen|SMART-TV` y `nativeHls` para Tizen).
- Los tokens van en la URL (incluyen headers del portal); no compartir enlaces.
- El plan gratuito de Workers alcanza: el bundle pesa ~115 KB y cada request
  hace pocas subrequests.
- La sesión del portal vive en memoria del isolate; el primer request puede
  tardar unos segundos y los siguientes reutilizan la sesión.
