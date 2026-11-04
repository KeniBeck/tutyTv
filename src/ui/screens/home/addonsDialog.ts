import {
  hasAddonUrl,
  isM3uAddonUrl,
  removeAddonAt,
  upsertM3uAddon,
  type M3uAddon
} from "../../../core/usecases/live/addons";
import type { LiveCategory } from "./liveMenu";
import type { LiveNode } from "./liveList";

export interface AddonPreset {
  id?: string;
  name: string;
  url: string;
  desc?: string;
  count?: number;
}

export type AddonEntry = M3uAddon;

interface DialogNode extends LiveNode {
  value?: string;
  _activate?: () => void;
}

export interface AddonsDialogHost {
  getPresets(): AddonPreset[];
  getAddons(): AddonEntry[];
  saveAddons(addons: M3uAddon[]): void;
  installAddon(entry: AddonPreset, done: (error: string | null, count?: number) => void): void;
  requestM3u(
    url: string,
    done: (error: unknown, response: { channels?: unknown[] } | null) => void
  ): void;
  getSelectedCategory(): LiveCategory | null;
  reloadChannels(): void;
  byId(id: string): DialogNode | null;
  el(tag: string, className?: string, text?: string): DialogNode;
  clear(element: DialogNode): void;
  firstFocus(root: Element): DialogNode | null;
  focus(element: LiveNode | null): void;
  isChannelsOpen(): boolean;
  getChannelsPanel(): DialogNode | null;
  getPlayerFocus(): LiveNode | null;
  setOpen(open: boolean): void;
}

let host: AddonsDialogHost | null = null;

export function attachAddonsDialog(next: AddonsDialogHost): boolean {
  host = next;
  return true;
}

export function hasAddonsDialogRuntime(): boolean {
  return host !== null;
}

function refreshDialog(): void {
  if (!host) {
    return;
  }
  const presetsContainer = host.byId("da-presets-list");
  const installedContainer = host.byId("da-installed-list");
  const addons = host.getAddons();

  if (presetsContainer) {
    host.clear(presetsContainer);
    for (const preset of host.getPresets()) {
      const item = host.el("div", "da-preset-item");
      const info = host.el("div", "da-preset-info");
      info.appendChild(host.el("div", "da-preset-name", preset.name));
      info.appendChild(host.el("div", "da-preset-desc", preset.desc || ""));
      item.appendChild(info);
      const installed = hasAddonUrl(addons, preset.url);
      const button = host.el(
        "button",
        "da-preset-btn focusable" + (installed ? " is-installed" : ""),
        installed ? "✔ Instalado" : "+ Instalar"
      );
      button._activate = function installPreset() {
        if (installed || !host) {
          return;
        }
        button.textContent = "Instalando…";
        host.installAddon(preset, function afterInstall(error) {
          if (!host) {
            return;
          }
          if (error) {
            button.textContent = "Error";
            setTimeout(function resetButton() {
              button.textContent = "+ Instalar";
            }, 2000);
            return;
          }
          refreshDialog();
          const selected = host.getSelectedCategory();
          if (selected && selected.isAddon) {
            host.reloadChannels();
          }
        });
      };
      item.appendChild(button);
      presetsContainer.appendChild(item);
    }
  }

  if (installedContainer) {
    host.clear(installedContainer);
    if (addons.length) {
      for (let index = 0; index < addons.length; index += 1) {
        const addon = addons[index];
        if (!addon) {
          continue;
        }
        const item = host.el("div", "da-installed-item");
        const info = host.el("div", "da-installed-info");
        info.appendChild(host.el("div", "da-preset-name", addon.name || "Lista M3U"));
        info.appendChild(host.el("div", "da-preset-desc", (addon.count ? `${addon.count} canales • ` : "") + addon.url));
        item.appendChild(info);
        const remove = host.el("button", "da-del-btn focusable", "Eliminar");
        remove._activate = function removeAddon() {
          if (!host) {
            return;
          }
          const next = removeAddonAt(addons, index);
          host.saveAddons(next);
          refreshDialog();
          const selected = host.getSelectedCategory();
          if (selected && selected.isAddon) {
            host.reloadChannels();
          }
        };
        item.appendChild(remove);
        installedContainer.appendChild(item);
      }
    } else {
      installedContainer.appendChild(host.el(
        "div",
        "da-installed-empty",
        "No hay addons personalizados instalados aún. Instala una lista recomendada arriba o escribe una URL."
      ));
    }
  }

  const addButton = host.byId("da-btn-add-custom");
  if (addButton) {
    addButton._activate = function addCustom() {
      if (!host) {
        return;
      }
      const input = host.byId("da-custom-url");
      const url = input?.value ? input.value.trim() : "";
      if (!url || !isM3uAddonUrl(url)) {
        alert("Por favor introduce una URL válida (http:// o https://)");
        return;
      }
      addButton.textContent = "Descargando…";
      host.installAddon({
        id: `custom_${Date.now()}`,
        name: "Lista Personalizada",
        url
      }, function afterCustom(error) {
        if (!host) {
          return;
        }
        addButton.textContent = "Agregar";
        if (error) {
          alert(`No se pudo cargar la lista M3U: ${error}`);
          return;
        }
        if (input) {
          input.value = "";
        }
        refreshDialog();
        const selected = host.getSelectedCategory();
        if (selected && selected.isAddon) {
          host.reloadChannels();
        }
      });
    };
  }

  const exitButton = host.byId("da-btn-exit");
  if (exitButton) {
    exitButton._activate = function exitDialog() {
      closeAddons();
    };
  }
}

export function installAddonList(
  entry: AddonPreset,
  done?: (error: string | null, count?: number) => void
): boolean {
  const finish = done || function ignoreInstall() {};
  if (!host || !entry || !entry.url) {
    finish("URL no válida");
    return false;
  }
  host.requestM3u(entry.url, function onM3u(error, response) {
    if (!host) {
      return;
    }
    const channels = !error && response && response.channels ? response.channels : [];
    if (error || !channels.length) {
      finish(error ? String(error) : "No se encontraron canales en la lista");
      return;
    }
    host.saveAddons(upsertM3uAddon(host.getAddons(), entry, channels.length));
    finish(null, channels.length);
  });
  return true;
}

export function openAddons(): boolean {
  if (!host) {
    return false;
  }
  host.setOpen(true);
  const dialog = host.byId("dialog-addons");
  if (dialog) {
    dialog.classList.add("is-active");
    refreshDialog();
    const first = dialog.querySelector(".focusable") as DialogNode | null;
    if (first) {
      host.focus(first);
    }
  }
  return true;
}

export function closeAddons(): boolean {
  if (!host) {
    return false;
  }
  host.setOpen(false);
  const dialog = host.byId("dialog-addons");
  dialog?.classList.remove("is-active");
  if (host.isChannelsOpen()) {
    const panel = host.getChannelsPanel();
    const button = panel?.querySelector("#pc-btn-addons") as DialogNode | null;
    host.focus(button || host.getPlayerFocus());
  }
  return true;
}

export function resetAddonsDialogRuntime(): void {
  host = null;
}
