import type { AppState } from "../../runtime/state";

export interface SettingsMedia {
  id?: string | undefined;
  title?: string | undefined;
  poster?: string | undefined;
  cover?: string | undefined;
  [key: string]: unknown;
}

export interface SettingsHistoryEntry extends SettingsMedia {
  episodeNumber?: string | number;
  position?: number;
  reminder?: boolean;
  series?: boolean;
}

export interface SettingsProfile {
  id?: string;
  history?: SettingsHistoryEntry[];
  reminders?: Record<string, SettingsHistoryEntry>;
  favs?: Record<string, boolean>;
}

export interface SettingsNode extends HTMLElement {
  _activate?: () => void;
  _onMove?: (direction: string) => boolean;
  _index?: number;
  _group?: string;
  _kind?: string;
}

export interface SettingsHost {
  state: AppState;
  getProfile(): SettingsProfile;
  getCatalog(): SettingsMedia[];
  isSeries(item: SettingsMedia): boolean;
  openHistory(entry: SettingsHistoryEntry): void;
  formatTime(value: number): string;
  refreshPlayback(): void;
  onStreamModeChanged(): void;
  byId(id: string): SettingsNode | null;
  el(tag: string, className?: string, text?: string): SettingsNode;
  clear(element: SettingsNode): void;
  place(element: SettingsNode, left: number, top: number, width?: number, height?: number): SettingsNode;
  focus(element: SettingsNode | null): void;
  firstFocus(root: Element): SettingsNode | null;
  showScreen(name: string): void;
}

const MENU = [
  { id: "profile", label: "Mi cuenta" },
  { id: "history", label: "Mi lista" },
  { id: "share", label: "Compartir APP" },
  { id: "parent", label: "Bloqueo" },
  { id: "playback", label: "Configuración global" },
  { id: "feedback", label: "Ayuda y Feedback" },
  { id: "about", label: "Sobre nosotros" }
];

const ICONS: Record<string, string> = {
  profile: '<svg viewBox="0 0 32 32"><circle cx="16" cy="10" r="5"/><path d="M6 27c.7-6 4.3-9 10-9s9.3 3 10 9"/></svg>',
  history: '<svg viewBox="0 0 32 32"><rect x="4" y="4" width="9" height="9"/><rect x="19" y="4" width="9" height="9"/><rect x="4" y="19" width="9" height="9"/><rect x="19" y="19" width="9" height="9"/></svg>',
  share: '<svg viewBox="0 0 32 32"><circle cx="8" cy="16" r="3"/><circle cx="24" cy="7" r="3"/><circle cx="24" cy="25" r="3"/><path d="M10.6 14.5l10.8-6M10.6 17.5l10.8 6"/></svg>',
  parent: '<svg viewBox="0 0 32 32"><rect x="7" y="14" width="18" height="14" rx="2"/><path d="M11 14V10a5 5 0 0 1 10 0v4"/><path d="M16 19v4"/></svg>',
  playback: '<svg viewBox="0 0 32 32"><rect x="4" y="6" width="24" height="20" rx="3"/><path d="M13 11l8 5-8 5z"/></svg>',
  feedback: '<svg viewBox="0 0 32 32"><path d="M6 4h15l5 5v19H6z"/><path d="M20 4v6h6M10 16h12M10 21h8"/></svg>',
  about: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12"/><path d="M16 14v8M16 10h.1"/></svg>'
};

let host: SettingsHost | null = null;
let menu: SettingsNode | null = null;
let right: SettingsNode | null = null;
let menuItems: SettingsNode[] = [];
let panels: Record<string, SettingsNode> = {};
let initialized = false;
let historyTab: "history" | "favs" | "reminders" = "history";

export function attachSettings(next: SettingsHost): boolean {
  host = next;
  return true;
}

export function hasSettingsRuntime(): boolean {
  return host !== null;
}

function panelTitle(title: string): SettingsNode {
  if (!host) {
    return {} as SettingsNode;
  }
  const panel = host.el("div", "settings-panel");
  panel.appendChild(host.el("div", "sp-title", title));
  return panel;
}

function buildProfile(): SettingsNode {
  if (!host) {
    return {} as SettingsNode;
  }
  const panel = host.el("div", "settings-panel account-panel");
  const avatar = host.el("div", "account-avatar");
  avatar.innerHTML = ICONS.profile || "";
  panel.appendChild(avatar);
  panel.appendChild(host.el("div", "account-number", host.getProfile().id || ""));
  panel.appendChild(host.el("div", "account-type", "Perfil local de este televisor"));
  const card = host.el("div", "account-card");
  card.appendChild(host.el("div", "account-card-title", "Tu cuenta está lista"));
  card.appendChild(host.el("div", "account-card-text", "Las preferencias, el historial y el capítulo que estabas viendo se guardan automáticamente en este TV."));
  panel.appendChild(card);
  const historyButton = host.el("div", "account-history-btn focusable", "Ver mi lista");
  historyButton._activate = function openHistory() {
    selectSettingsTab(1, true);
  };
  panel.appendChild(historyButton);
  const small = host.el("div", "account-card account-card-small");
  small.appendChild(host.el("div", "account-card-title", "Sin registro ni contraseña"));
  small.appendChild(host.el("div", "account-card-text", "Este perfil no envía tus datos a ningún servidor."));
  panel.appendChild(small);
  return panel;
}

function buildHistory(): SettingsNode {
  if (!host) {
    return {} as SettingsNode;
  }
  const panel = host.el("div", "settings-panel history-panel");
  const tabs = host.el("div", "history-tabs");
  const tabDefs = [
    { id: "history" as const, label: "Historia" },
    { id: "favs" as const, label: "Mi favoritos" },
    { id: "reminders" as const, label: "Recordatorios" }
  ];
  for (const tab of tabDefs) {
    const button = host.el("div", "history-tab focusable" + (historyTab === tab.id ? " is-selected" : ""), tab.label);
    button._activate = function activateHistoryTab() {
      historyTab = tab.id;
      selectSettingsTab(1, true);
    };
    tabs.appendChild(button);
  }
  panel.appendChild(tabs);
  panel.appendChild(host.el("div", "history-rule"));

  const entries: SettingsHistoryEntry[] = [];
  const profile = host.getProfile();
  if (historyTab === "history") {
    entries.push(...(profile.history || []));
  } else if (historyTab === "favs") {
    for (const item of host.getCatalog()) {
      if (item.id && profile.favs?.[item.id]) {
        entries.push({
          id: item.id,
          title: item.title,
          poster: item.poster || item.cover,
          series: host.isSeries(item),
          position: 0
        });
      }
    }
  } else {
    const seen: Record<string, true> = {};
    for (const item of host.getCatalog()) {
      const id = String(item.id || "");
      const reminder = profile.reminders?.[id];
      if (reminder) {
        seen[id] = true;
        entries.push({
          id: item.id,
          title: item.title,
          poster: item.poster || item.cover,
          series: true,
          reminder: true,
          position: 0
        });
      }
    }
    for (const id in profile.reminders) {
      if (Object.prototype.hasOwnProperty.call(profile.reminders, id) && !seen[id]) {
        const reminder = profile.reminders[id];
        entries.push({
          id,
          title: reminder?.title || "Contenido",
          poster: reminder?.poster || "",
          series: true,
          reminder: true,
          position: 0
        });
      }
    }
  }

  const total = host.el("div", "history-total", "Total ");
  total.appendChild(host.el("span", undefined, String(entries.length)));
  panel.appendChild(total);
  const grid = host.el("div", "history-grid");
  if (entries.length) {
    for (let index = 0; index < entries.length && index < 15; index += 1) {
      const entry = entries[index];
      if (!entry) {
        continue;
      }
      const card = host.el("div", "history-card focusable");
      const image = host.el("img", "history-poster") as HTMLImageElement;
      image.alt = "";
      image.src = entry.poster || "assets/original/common/bg_placehoder_vertical.png";
      card.appendChild(image);
      const progress = entry.reminder
        ? "Recordatorio activo"
        : entry.series
          ? `Ya miró ${entry.episodeNumber ? `epis. ${entry.episodeNumber}` : "un episodio"}${entry.position ? ` · ${host.formatTime(entry.position)}` : ""}`
          : `Ya miró hasta ${host.formatTime(entry.position || 0)}`;
      card.appendChild(host.el("div", "history-progress", progress));
      card.appendChild(host.el("div", "history-card-title", entry.title || "Contenido"));
      card._activate = function openHistoryCard() {
        host?.openHistory(entry);
      };
      grid.appendChild(card);
    }
  } else {
    grid.appendChild(host.el("div", "history-grid-empty", "No hay títulos para mostrar todavía."));
  }
  panel.appendChild(grid);
  return panel;
}

function buildPlayback(): SettingsNode {
  if (!host) {
    return {} as SettingsNode;
  }
  const panel = panelTitle("Configuración global de reproducción");
  panel.appendChild(host.el("div", "sp-hr"));
  panel.appendChild(host.el("div", "sp-global-note", "Estas preferencias se aplican automáticamente a todas las películas y series nuevas."));
  buildOptionRow(panel, 198, "Reproductor", ["Normal (directo)", "Modo fluido"], "streamMode", host.state.playback.streamMode === "smooth" ? 1 : 0);
  buildOptionRow(panel, 307, "Formato de pantalla", ["Pantalla completa", "Normal", "16:9", "4:3"], "screen", host.state.playback.screen);
  buildOptionRow(panel, 416, "Audio preferido", ["Español", "Portugués", "Inglés"], "audio", host.state.playback.audio);
  panel.appendChild(host.place(host.el("div", "sp-hr"), 0, 535, 1498, 1));
  panel.appendChild(host.el("div", "sp-subtitle-h", "Subtitulos"));
  const subtitle = host.el("div", "sp-switch focusable " + (host.state.playback.subtitle ? "on" : "off"));
  subtitle._activate = function toggleSubtitle() {
    if (!host) {
      return;
    }
    host.state.playback.subtitle = !host.state.playback.subtitle;
    subtitle.className = "sp-switch focusable " + (host.state.playback.subtitle ? "on" : "off");
    host.refreshPlayback();
    host.focus(subtitle);
  };
  panel.appendChild(subtitle);
  buildOptionRow(panel, 680, "Idioma", ["Español", "Portugués", "Inglés"], "subLang", host.state.playback.subLang);
  buildOptionRow(panel, 793, "Tamaño", ["Normal", "Grande", "Pequeño"], "size", host.state.playback.size);

  const styleRow = host.el("div", "pb-row");
  styleRow.style.top = "906px";
  styleRow.appendChild(host.el("div", "pb-label", "Estilo"));
  const colors = ["#ffffff", "#f6e33f", "#ffffff"];
  for (let index = 0; index < 3; index += 1) {
    const option = host.el("div", "pb-opt focusable" + (index === host.state.playback.style ? " is-checked" : ""));
    option.style.marginLeft = (index === 0 ? 0 : 28) + "px";
    option.appendChild(host.el("div", "radio"));
    const sample = host.el("span", undefined, "Aa");
    sample.style.color = colors[index] || "";
    if (index === 2) {
      sample.style.background = "#000000";
      sample.style.display = "inline-block";
      sample.style.width = "94px";
      sample.style.height = "50px";
      sample.style.lineHeight = "50px";
      sample.style.fontSize = "28px";
    }
    option.appendChild(sample);
    option._group = "style";
    option._index = index;
    option._activate = function activateStyle() {
      if (!host) {
        return;
      }
      host.state.playback.style = index;
      host.refreshPlayback();
      const options = styleRow.querySelectorAll(".pb-opt");
      for (let cursor = 0; cursor < options.length; cursor += 1) {
        const node = options[cursor] as SettingsNode;
        if (node._group === "style") {
          node.classList.toggle("is-checked", node._index === index);
        }
      }
    };
    styleRow.appendChild(option);
  }
  panel.appendChild(styleRow);
  return panel;
}

function buildOptionRow(
  panel: SettingsNode,
  top: number,
  label: string,
  values: string[],
  group: string,
  selected: number
): void {
  if (!host) {
    return;
  }
  const row = host.el("div", "pb-row");
  row.style.top = `${top}px`;
  row.appendChild(host.el("div", "pb-label", label));
  for (let index = 0; index < values.length; index += 1) {
    const option = host.el("div", "pb-opt focusable" + (index === selected ? " is-checked" : ""));
    option.style.marginLeft = (index === 0 ? 0 : 28) + "px";
    option.appendChild(host.el("div", "radio"));
    option.appendChild(host.el("span", undefined, values[index] || ""));
    option._group = group;
    option._index = index;
    option._activate = function activateOption() {
      if (!host) {
        return;
      }
      if (group === "streamMode") {
        host.state.playback.streamMode = index === 1 ? "smooth" : "normal";
        host.onStreamModeChanged();
      } else {
        (host.state.playback as unknown as Record<string, unknown>)[group] = index;
        if (group === "audio") {
          host.state.playback.audioCode = "";
        } else if (group === "subLang") {
          host.state.playback.subCode = "";
        }
      }
      host.refreshPlayback();
      const options = row.querySelectorAll(".pb-opt");
      for (let cursor = 0; cursor < options.length; cursor += 1) {
        const node = options[cursor] as SettingsNode;
        if (node._group === group) {
          node.classList.toggle("is-checked", node._index === index);
        }
      }
    };
    row.appendChild(option);
  }
  panel.appendChild(row);
}

function buildSimplePanels(): void {
  if (!host) {
    return;
  }
  const share = panelTitle("Compartir APP");
  share.appendChild(host.el("div", "sp-hr"));
  share.appendChild(host.el("div", "share-copy", "Instala TutyTV en otro televisor desde tu propia IPK. El historial de este perfil permanece privado en este TV."));
  panels.share = share;

  const parent = host.el("div", "settings-panel");
  parent.appendChild(host.el("div", "pl-title", "Configuraciones del Control Parental"));
  parent.appendChild(host.el("div", "pl-tip", "Ingrese la contraseña de cuatro dígitos e ingrese viendo el programa de bloqueo."));
  parent.appendChild(host.el("div", "pl-label", "Contraseña inicial:"));
  const boxes = host.el("div", "pl-boxes");
  for (let index = 0; index < 4; index += 1) {
    const box = host.el("div", "pl-box focusable");
    box._activate = function activateBox() {};
    boxes.appendChild(box);
    if (index < 3) {
      boxes.appendChild(host.el("div", "pl-sep"));
    }
  }
  parent.appendChild(boxes);
  parent.appendChild(host.el("div", "pl-note", ""));
  const ok = host.el("div", "pl-ok focusable", "OK");
  ok._activate = function activateOk() {};
  parent.appendChild(ok);
  panels.parent = parent;

  const feedback = host.el("div", "settings-panel");
  feedback.appendChild(host.el("div", "fb-title", "Ayuda y Feedback"));
  feedback.appendChild(host.el("div", "fb-hr"));
  feedback.appendChild(host.el("div", "fb-contact", "Si tiene alguna duda, puede ponerse en contacto con nosotros a través de los siguientes medios:"));
  feedback.appendChild(host.el("div", "fb-qr-note", "Escanee el código QR para enviar sugerencias o comentarios."));
  feedback.appendChild(host.el("div", "fb-qr"));
  const help = host.el("div", "fb-help focusable", "Ayuda");
  help._activate = function activateHelp() {};
  feedback.appendChild(help);
  panels.feedback = feedback;

  const about = host.el("div", "settings-panel");
  about.appendChild(host.el("div", "sp-title plain", "Sobre nosotros"));
  about.appendChild(host.place(host.el("div", "sp-hr soft"), 0, 165, 1498, 1));
  about.appendChild(host.el("div", "sp-about-body", "TutyTV se dedica a ofrecer a los usuarios una amplia variedad de recursos de alta calidad. Aquí encontrarás miles de películas, series, animes y canales en vivo, todo reunido en un solo lugar. Brindamos una experiencia estable, diversa y siempre actualizada, además de contenidos gratuitos para disfrutar."));
  about.appendChild(host.el("div", "sp-about-port", "Port para LG webOS realizado por CristiancoDEV"));
  const mail = host.el("div", "sp-about-mail");
  const image = host.el("img") as HTMLImageElement;
  image.src = "assets/original/settings/vod_email_icon.png";
  image.alt = "";
  mail.appendChild(image);
  mail.appendChild(host.el("span", undefined, "escuchamos-tv@outlook.com"));
  about.appendChild(mail);
  panels.about = about;
}

function buildSettings(): void {
  if (!host) {
    return;
  }
  menu = host.byId("settings-menu");
  right = host.byId("settings-right");
  if (!menu || !right) {
    return;
  }
  host.clear(menu);
  host.clear(right);
  menuItems = [];
  for (let index = 0; index < MENU.length; index += 1) {
    const item = MENU[index];
    if (!item) {
      continue;
    }
    const node = host.el("div", "settings-item focusable");
    node.innerHTML = `<span class="settings-icon">${ICONS[item.id] || ""}</span><span class="settings-label">${item.label}</span>`;
    node._index = index;
    node._activate = function activateMenu() {
      selectSettingsTab(index, true);
    };
    node._onMove = function moveMenu(direction: string) {
      if (direction === "right") {
        const active = right?.querySelector(".settings-panel.is-active") as SettingsNode | null;
        const first = active ? host?.firstFocus(active) : null;
        if (first) {
          host?.focus(first);
        }
        return true;
      }
      return false;
    };
    menu.appendChild(node);
    menuItems.push(node);
  }

  panels = {};
  panels.profile = buildProfile();
  panels.history = buildHistory();
  buildSimplePanels();
  panels.playback = buildPlayback();
  for (const id in panels) {
    if (Object.prototype.hasOwnProperty.call(panels, id) && panels[id]) {
      right.appendChild(panels[id]!);
    }
  }
}

export function selectSettingsTab(index: number, focusPanel: boolean): boolean {
  if (!host) {
    return false;
  }
  if (!initialized) {
    buildSettings();
    initialized = true;
  }
  const id = MENU[index]?.id || "profile";
  const screen = host.byId("screen-settings");
  screen?.classList.toggle("is-history-view", id === "history");
  if (id === "profile" && panels.profile && right) {
    const next = buildProfile();
    right.replaceChild(next, panels.profile);
    panels.profile = next;
  } else if (id === "history" && panels.history && right) {
    const next = buildHistory();
    right.replaceChild(next, panels.history);
    panels.history = next;
  }
  for (let cursor = 0; cursor < menuItems.length; cursor += 1) {
    menuItems[cursor]?.classList.toggle("is-selected", cursor === index);
  }
  for (const key in panels) {
    if (Object.prototype.hasOwnProperty.call(panels, key) && panels[key]) {
      panels[key]!.classList.toggle("is-active", key === id);
    }
  }
  if (focusPanel) {
    const panel = panels[id];
    const first = panel ? host.firstFocus(panel) : null;
    host.focus(first || menuItems[index] || null);
  }
  return true;
}

export function openSettings(): boolean {
  if (!host) {
    return false;
  }
  if (!initialized) {
    buildSettings();
    initialized = true;
  }
  host.showScreen("settings");
  selectSettingsTab(0, false);
  const first = menuItems[0];
  if (first) {
    host.focus(first);
  }
  return true;
}

export function resetSettingsRuntime(): void {
  host = null;
  menu = null;
  right = null;
  menuItems = [];
  panels = {};
  initialized = false;
  historyTab = "history";
}
