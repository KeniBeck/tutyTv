import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { ServerResponse } from "node:http";
import type { Plugin, ViteDevServer } from "vite";

interface LegacyServerModule {
  API_METHODS: Set<string>;
  handleApi(method: string, query: Record<string, string>, res: ServerResponse): void;
}

export interface LegacyWebPluginOptions {
  repoRoot: string;
  hlsFile: string;
  devCoreFile: string;
  devUiFile: string;
  buildLabel?: string;
}

export function legacyWebPlugin(options: LegacyWebPluginOptions): Plugin {
  const buildLabel = options.buildLabel ?? "dev";
  const requireFromRepo = createRequire(resolve(options.repoRoot, "package.json"));
  const devCoreUrl = `/@fs${pathToFileURL(options.devCoreFile).pathname}`;
  const devUiUrl = `/@fs${pathToFileURL(options.devUiFile).pathname}`;
  const legacyAppDir = resolve(
    options.repoRoot,
    "src/webos/app"
  );
  const fullReloadFiles = new Set([
    resolve(legacyAppDir, "config/api.js"),
    resolve(legacyAppDir, "data/portal.js"),
    resolve(legacyAppDir, "data/catalog.js"),
    resolve(legacyAppDir, "js/webOSTV.js")
  ]);
  let legacyServer: LegacyServerModule | null = null;

  const getLegacyServer = (): LegacyServerModule => {
    if (!legacyServer) {
      legacyServer = requireFromRepo(
        resolve(options.repoRoot, "src/web/server.js")
      ) as LegacyServerModule;
    }
    return legacyServer;
  };

  return {
    name: "tuty-legacy-web",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url || "/", "http://localhost");
        const method = url.pathname.replace(/^\/+/, "");
        const api = getLegacyServer();

        if (api.API_METHODS.has(method)) {
          const query: Record<string, string> = {};
          url.searchParams.forEach((value, key) => {
            query[key] = value;
          });
          api.handleApi(method, query, res);
          return;
        }

        if (url.pathname === "/hls.min.js") {
          res.writeHead(200, {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "no-store"
          });
          res.end(readFileSync(options.hlsFile));
          return;
        }

        next();
      });

      server.watcher.on("change", (file) => {
        if (fullReloadFiles.has(resolve(file))) {
          server.ws.send({ type: "full-reload" });
        }
      });
    },
    transformIndexHtml(html) {
      const withModules = html
        .replace(
          '<link rel="stylesheet" href="css/style.css">',
          '<script type="module">import "/css/style.css";</script>'
        )
        .replace(
          '<link rel="stylesheet" href="css/ui-glass.css">',
          '<script type="module">import "/css/ui-glass.css";</script>'
        )
        .replace(
          '<script src="js/tuty-core.js"></script>',
          `<script type="module" src="${devCoreUrl}"></script>`
        )
        .replace(
          '<script src="js/tuty-ui.js"></script>',
          `<script type="module" src="${devUiUrl}"></script>`
        )
        .replace(
          '<script src="js/app.js"></script>',
          '<script type="module" src="/js/app.js"></script>'
        );

      return {
        html: withModules,
        tags: [
          {
            tag: "script",
            children:
              `window.TUTYTV_WEB=true;window.TUTYTV_WEB_BUILD=${JSON.stringify(buildLabel)};` +
              'console.log("[TutyTV Web] build "+window.TUTYTV_WEB_BUILD);',
            injectTo: "body"
          },
          {
            tag: "script",
            children:
              "window.TUTYTV_API&&(window.TUTYTV_API.devServiceUrl=location.origin);",
            injectTo: "body"
          },
          {
            tag: "script",
            attrs: { src: "/hls.min.js" },
            injectTo: "body"
          }
        ]
      };
    }
  };
}
