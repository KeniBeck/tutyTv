import { normalizeText } from "../../../core/text/normalizeText";

export interface HomeItem {
  id?: string;
  title?: string;
  poster?: string;
  landscape?: string;
  score?: string | number;
  year?: string | number;
  duration?: string | number;
  genres?: string[] | string;
  synopsis?: string;
  kind?: string;
  category?: string;
  _portal?: boolean;
  _detailsLoaded?: boolean;
  [key: string]: unknown;
}

export interface HomeNode extends HTMLElement {
  _item?: HomeItem | undefined;
  _activate?: () => void;
  _onMove?: (direction: string) => boolean;
  _bentoTimer?: ReturnType<typeof setInterval> | null;
}

export interface HomePageHost {
  getCatalog(): HomeItem[];
  filterCategory(category: string): HomeItem[];
  selectPage(category: string, limit: number, offset: number): HomeItem[];
  el(tag: string, className?: string, text?: string): HomeNode;
  place(element: HomeNode, left: number, top: number, width?: number, height?: number): HomeNode;
  openDetail(item: HomeItem): void;
  afterBuild(): void;
  isHomeScreen(): boolean;
  onHeroLeft?(): void;
}

const CONTENT = {
  left: 160,
  top: 16,
  width: 1720,
  height: 940
};

const HERO = {
  left: 0,
  top: 0,
  width: 1280,
  height: 620
};

const SIDE = {
  left: 1304,
  top: 0,
  width: 416,
  height: 620
};

const ROW_HEAD_TOP = 654;
const CARDS_TOP = 706;
const CARD_WIDTH = 415;
const CARD_HEIGHT = 194;
const CARD_GAP = 20;
const EXTRA_ROW_TOP = 940;
const EXTRA_ROW_PITCH = 266;

function isNew(item: HomeItem): boolean {
  const flag = item.isNew ?? item.new ?? item.is_new ?? item.recent;
  return flag === true || flag === 1 || item.badge === "NUEVO";
}

function categoryItems(host: HomePageHost, category: string): HomeItem[] {
  const key = normalizeText(category);
  if (!key) {
    return [];
  }
  const catalog = host.getCatalog();
  const strict: HomeItem[] = [];
  for (const item of catalog) {
    const categories = normalizeText(item.category || "").split(",").map(function trim(value) {
      return value.trim();
    });
    if (categories.indexOf(key) !== -1) {
      strict.push(item);
    }
  }
  if (strict.length) {
    return strict;
  }
  const fallback = host.filterCategory(category);
  if (key === "destacado") {
    return fallback;
  }
  return fallback.filter(function withoutFeatured(item) {
    const categories = normalizeText(item.category || "").split(",").map(function trim(value) {
      return value.trim();
    });
    return categories.indexOf("destacado") === -1;
  });
}

function textOf(value: unknown, fallback: string): string {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

function genreOf(item: HomeItem): string {
  const source = item.genres;
  if (Array.isArray(source)) {
    return source.length ? String(source[0]) : "";
  }
  if (typeof source === "string") {
    return source.split(",")[0]?.trim() || "";
  }
  return "";
}

function kickerOf(item: HomeItem): string {
  const kind = textOf(item.kind, "").toLowerCase();
  if (kind.indexOf("serie") !== -1) {
    return "Serie destacada";
  }
  if (kind.indexOf("pel") !== -1) {
    return "Película destacada";
  }
  return "Destacado";
}

function metaOf(item: HomeItem): Array<{ text: string; score?: boolean }> {
  const parts: Array<{ text: string; score?: boolean }> = [];
  const score = textOf(item.score, "");
  if (score && score !== "—") {
    parts.push({ text: score, score: true });
  }
  const year = textOf(item.year, "");
  if (year && year !== "—") {
    parts.push({ text: year });
  }
  const genre = genreOf(item);
  if (genre) {
    parts.push({ text: genre });
  }
  parts.push({ text: "HD" });
  return parts;
}

function image(
  host: HomePageHost,
  className: string,
  source: string
): HomeNode {
  const node = host.el("img", className) as HTMLImageElement;
  node.setAttribute("data-poster-src", source);
  node.onerror = function onImageError() {
    this.style.display = "none";
  };
  return node;
}

function heroCard(item: HomeItem, host: HomePageHost): HomeNode {
  const hero = host.el("div", "hero focusable");
  host.place(hero, HERO.left, HERO.top, HERO.width, HERO.height);
  const source = item.landscape || item.poster || "";
  if (source) {
    hero.appendChild(image(host, "hero-img", source));
  }
  const copy = host.el("div", "hero-copy");
  copy.appendChild(host.el("div", "hero-kicker", kickerOf(item)));
  copy.appendChild(host.el("h3", "hero-title", item.title || "Sin título"));
  const synopsis = textOf(item.synopsis, "");
  if (synopsis && synopsis !== "Sin sinopsis disponible.") {
    copy.appendChild(host.el("p", "hero-synopsis", synopsis));
  }
  const meta = host.el("div", "hero-meta");
  for (const part of metaOf(item)) {
    meta.appendChild(host.el("span", part.score ? "score" : "", part.text));
  }
  copy.appendChild(meta);
  const actions = host.el("div", "hero-actions");
  const play = host.el("div", "btn btn-primary");
  play.appendChild(host.el("i", "btn-play-icon"));
  play.appendChild(host.el("span", "btn-label", "Reproducir"));
  const info = host.el("div", "btn btn-glass", "Más información");
  actions.appendChild(play);
  actions.appendChild(info);
  copy.appendChild(actions);
  hero.appendChild(copy);
  hero._item = item;
  hero._activate = function activateHero() {
    host.openDetail(item);
  };
  hero._onMove = function moveHero(direction: string) {
    if (direction === "left" && host.onHeroLeft) {
      host.onHeroLeft();
      return true;
    }
    return false;
  };
  return hero;
}

const SIDE_ROTATE_MS = 5000;

function sideCard(
  items: HomeItem[],
  pageElement: HomeNode,
  host: HomePageHost
): HomeNode {
  const side = host.el("div", "side-card focusable");
  host.place(side, SIDE.left, SIDE.top, SIDE.width, SIDE.height);

  const image = host.el("img", "side-img") as HTMLImageElement;
  image.onerror = function onSideImageError() {
    this.style.display = "none";
  };
  side.appendChild(image);

  const copy = host.el("div", "side-copy");
  copy.appendChild(host.el("div", "side-label", "Destacado"));
  const title = host.el("div", "side-title");
  const score = host.el("div", "side-score");
  const sub = host.el("div", "side-sub");
  copy.appendChild(title);
  copy.appendChild(score);
  copy.appendChild(sub);
  side.appendChild(copy);

  let index = 0;
  function apply(item: HomeItem): void {
    side._item = item;
    const source = item.landscape || item.poster || "";
    if (source) {
      image.style.display = "";
      image.setAttribute("data-poster-src", source);
      image.setAttribute("src", source);
    } else {
      image.style.display = "none";
      image.removeAttribute("data-poster-src");
      image.removeAttribute("src");
    }
    title.textContent = item.title || "Sin título";
    const rating = textOf(item.score, "");
    score.textContent = rating && rating !== "—" ? "★ " + rating : "Sin calificación";
    const meta = [textOf(item.year, ""), genreOf(item)].filter(Boolean).join(" · ");
    sub.textContent = meta || textOf(item.kind, "Destacado");
  }

  if (items.length) {
    apply(items[0]!);
  }

  side._activate = function activateSide() {
    if (side._item) {
      host.openDetail(side._item);
    }
  };

  if (items.length > 1) {
    pageElement._bentoTimer = setInterval(function rotateSide() {
      if (!pageElement.classList.contains("is-current")) {
        return;
      }
      if (side.classList.contains("is-focused")) {
        return;
      }
      index = (index + 1) % items.length;
      const next = items[index];
      if (next) {
        side.classList.remove("is-rotating");
        apply(next);
        void side.offsetWidth;
        side.classList.add("is-rotating");
      }
    }, SIDE_ROTATE_MS);
  }

  return side;
}

function card(
  item: HomeItem,
  left: number,
  top: number,
  badge: boolean,
  host: HomePageHost
): HomeNode {
  const node = host.el("div", "card focusable");
  host.place(node, left, top, CARD_WIDTH, CARD_HEIGHT);
  const source = item.landscape || item.poster || "";
  if (source) {
    node.appendChild(image(host, "card-img", source));
  }
  if (badge) {
    node.appendChild(host.el("div", "card-badge", "NUEVO"));
  }
  node.appendChild(host.el("div", "card-copy", item.title || "Sin título"));
  node._item = item;
  node._activate = function activateCard() {
    host.openDetail(item);
  };
  return node;
}

function rowHead(
  top: number,
  title: string,
  host: HomePageHost,
  showMore = true
): HomeNode {
  const head = host.el("div", "row-head");
  host.place(head, 0, top, CONTENT.width, 40);
  head.appendChild(host.el("h4", "row-title", title));
  if (showMore) {
    head.appendChild(host.el("span", "row-more", "Ver todo"));
  }
  return head;
}

function buildMain(
  pageElement: HomeNode,
  items: HomeItem[],
  title: string,
  host: HomePageHost,
  includeExtras = true
): HomeNode | null {
  const list = items.length ? items : host.getCatalog();
  if (!list.length) {
    return null;
  }
  if (pageElement._bentoTimer) {
    clearInterval(pageElement._bentoTimer);
    pageElement._bentoTimer = null;
  }
  const content = host.el("div", "home-content");
  host.place(content, CONTENT.left, CONTENT.top, CONTENT.width, CONTENT.height);
  pageElement.appendChild(content);

  content.appendChild(heroCard(list[0]!, host));
  content.appendChild(
    sideCard(list.length > 1 ? list.slice(1) : list, pageElement, host)
  );
  content.appendChild(rowHead(ROW_HEAD_TOP, title, host));

  for (let index = 0; index < 4; index += 1) {
    const item = list[2 + index] || list[(2 + index) % list.length];
    if (item) {
      content.appendChild(
        card(
          item,
          index * (CARD_WIDTH + CARD_GAP),
          CARDS_TOP,
          isNew(item),
          host
        )
      );
    }
  }

  let extraTop = EXTRA_ROW_TOP;
  let extraIndex = includeExtras ? 6 : list.length;
  while (extraIndex < list.length) {
    const rowItems = list.slice(extraIndex, extraIndex + 4);
    if (!rowItems.length) {
      break;
    }
    for (let index = 0; index < rowItems.length; index += 1) {
      const item = rowItems[index];
      if (item) {
        content.appendChild(
          card(
            item,
            index * (CARD_WIDTH + CARD_GAP),
            extraTop,
            isNew(item),
            host
          )
        );
      }
    }
    extraTop += EXTRA_ROW_PITCH;
    extraIndex += 4;
  }
  content.style.height = Math.max(CONTENT.height, extraTop) + "px";
  host.afterBuild();
  return content;
}

function buildExplore(pageElement: HomeNode, host: HomePageHost): void {
  const catalog = host.getCatalog();
  const content = buildMain(pageElement, catalog, "Explorar", host, false);
  if (!content) {
    return;
  }
  const categories = [
    { key: "pelicula", label: "Películas" },
    { key: "serie", label: "Series" },
    { key: "anime", label: "Anime y animación" },
    { key: "infantil", label: "Infantil" },
    { key: "gratis", label: "Gratis" }
  ];
  let top = EXTRA_ROW_TOP;
  for (const category of categories) {
    const items = categoryItems(host, category.key).slice(0, 4);
    if (!items.length) {
      continue;
    }
    content.appendChild(rowHead(top, category.label, host, false));
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (item) {
        content.appendChild(
          card(item, index * (CARD_WIDTH + CARD_GAP), top + 52, isNew(item), host)
        );
      }
    }
    top += EXTRA_ROW_PITCH;
  }
  content.style.height = Math.max(CONTENT.height, top) + "px";
  host.afterBuild();
}

export function buildHomeVodPage(index: number, pageElement: HomeNode, host: HomePageHost): void {
  if (index === 1) {
    buildMain(pageElement, categoryItems(host, "destacado"), "Títulos destacados", host);
    return;
  }

  if (index === 2) {
    buildMain(pageElement, categoryItems(host, "pelicula"), "Películas", host);
    return;
  }

  if (index === 3) {
    buildMain(pageElement, categoryItems(host, "serie"), "Series", host);
    return;
  }

  if (index === 4) {
    let items = host.selectPage("infantil", 12, 0);
    if (!items.length) {
      items = host.getCatalog();
    }
    buildMain(pageElement, items, "Para niños", host);
    return;
  }

  if (index === 5) {
    buildMain(pageElement, categoryItems(host, "anime"), "Anime y animación", host);
    return;
  }

  if (index === 6) {
    buildExplore(pageElement, host);
  }
}
