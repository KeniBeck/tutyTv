export interface HomeItem {
  id?: string;
  title?: string;
  poster?: string;
  landscape?: string;
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

interface PosterOptions {
  gold?: boolean;
  type3?: boolean;
}

interface HeroOptions {
  titles?: boolean | undefined;
  dots?: number | undefined;
  shade?: boolean | undefined;
}

const BENTO = {
  bigW: 831,
  bigH: 534,
  bigY: 38.5,
  smallW: 413,
  smallH: 222,
  smallY: 578.5,
  bigX: [192, 1029],
  smallX: [192, 609, 1028, 1446]
};

function poster(
  item: HomeItem,
  left: number,
  top: number,
  width: number,
  height: number,
  options: PosterOptions | undefined,
  host: HomePageHost
): HomeNode {
  const settings = options || {};
  const node = host.el(
    "div",
    "poster focusable" +
      (settings.gold ? " gold" : "") +
      (settings.type3 ? " type3" : "")
  );
  host.place(node, left, top, width, height);
  if (item.poster) {
    const image = host.el("img", "p-img") as HTMLImageElement;
    image.setAttribute("data-poster-src", item.poster);
    image.onerror = function onPosterError() {
      this.style.display = "none";
    };
    node.appendChild(image);
  }
  if (!settings.gold) {
    node.appendChild(host.el("div", "p-shade"));
    node.appendChild(host.el("div", "p-title", item.title || ""));
  }
  node._item = item;
  node._activate = function activatePoster() {
    host.openDetail(item);
  };
  host.afterBuild();
  return node;
}

function bento(
  item: HomeItem | undefined,
  left: number,
  top: number,
  width: number,
  height: number,
  options: HeroOptions | undefined,
  host: HomePageHost
): HomeNode {
  const settings = options || {};
  const node = host.el("div", "bento focusable");
  host.place(node, left, top, width, height);
  const source = item ? item.landscape || item.poster : "";
  if (source) {
    const image = host.el("img", "bento-img") as HTMLImageElement;
    image.setAttribute("data-poster-src", source);
    image.onerror = function onBentoError() {
      this.style.display = "none";
    };
    node.appendChild(image);
  }
  if (settings.shade) {
    node.appendChild(host.el("div", "bento-shade"));
  }
  if (settings.titles && item) {
    node.appendChild(host.el("div", "bento-title", item.title || ""));
  }
  node._item = item;
  if (item) {
    node._activate = function activateBento() {
      host.openDetail(item);
    };
  }
  host.afterBuild();
  return node;
}

function heroRow(pageElement: HomeNode, items: HomeItem[], options: HeroOptions | undefined, host: HomePageHost): void {
  const settings = options || {};
  const list = items.length ? items : host.getCatalog();
  if (!list.length) {
    return;
  }
  if (pageElement._bentoTimer) {
    clearInterval(pageElement._bentoTimer);
    pageElement._bentoTimer = null;
  }

  const heroItems = list.slice(0, 4);
  let heroIndex = 0;
  const hero = bento(heroItems[0], BENTO.bigX[0]!, BENTO.bigY, BENTO.bigW, BENTO.bigH, {
    shade: settings.shade !== false,
    titles: settings.titles
  }, host);
  pageElement.appendChild(hero);
  hero._activate = function activateHero() {
    if (hero._item) {
      host.openDetail(hero._item);
    }
  };
  hero._onMove = function moveHero(direction: string) {
    if (direction === "left" && host.onHeroLeft) {
      host.onHeroLeft();
      return true;
    }
    return false;
  };
  pageElement.appendChild(bento(list[4] || list[0], BENTO.bigX[1]!, BENTO.bigY, BENTO.bigW, BENTO.bigH, {
    shade: settings.shade !== false,
    titles: settings.titles
  }, host));
  for (let index = 0; index < 4; index += 1) {
    pageElement.appendChild(bento(
      list[5 + index] || list[(5 + index) % list.length],
      BENTO.smallX[index]!,
      BENTO.smallY,
      BENTO.smallW,
      BENTO.smallH,
      {},
      host
    ));
  }

  if (heroItems.length > 1) {
    pageElement._bentoTimer = setInterval(function rotateHero() {
      if (!hero.parentNode || !pageElement.classList.contains("is-current") || !host.isHomeScreen()) {
        return;
      }
      heroIndex = (heroIndex + 1) % heroItems.length;
      const item = heroItems[heroIndex];
      if (!item) {
        return;
      }
      const previous = hero.querySelector(".bento-img") as HTMLImageElement | null;
      const source = item.landscape || item.poster || "";
      const next = host.el("img", "bento-img") as HTMLImageElement;
      hero._item = item;
      next.setAttribute("data-poster-src", source);
      if (source) {
        next.src = source;
      } else {
        next.style.display = "none";
      }
      next.style.transition = "opacity .55s ease";
      next.style.opacity = "0";
      next.style.zIndex = "2";
      hero.appendChild(next);
      if (previous) {
        previous.style.transition = "opacity .55s ease";
        previous.style.zIndex = "1";
      }
      setTimeout(function showNext() {
        next.style.opacity = "1";
        if (previous) {
          previous.style.opacity = "0";
        }
      }, 20);
      setTimeout(function removePrevious() {
        if (previous && previous.parentNode) {
          previous.parentNode.removeChild(previous);
        }
        next.style.opacity = "";
        next.style.transition = "";
        next.style.zIndex = "";
      }, 650);
      const title = hero.querySelector(".bento-title");
      if (title) {
        setTimeout(function updateTitle() {
          title.textContent = item.title || "";
        }, 260);
      }
    }, 5000);
  }
}

function posterRow(pageElement: HomeNode, items: HomeItem[], top: number | undefined, title: string | undefined, host: HomePageHost): void {
  if (!items || !items.length) {
    return;
  }
  let y = top || 860;
  const heading = host.el("div", "kids-subtitle", title || "Catálogo");
  host.place(heading, 192, y, 1249, 40);
  pageElement.appendChild(heading);
  y += 50;
  const count = Math.min(items.length, 60);
  for (let index = 0; index < count; index += 1) {
    const item = items[index];
    if (!item) {
      continue;
    }
    const left = 192 + 276 * (index % 6);
    const rowTop = y + 390 * Math.floor(index / 6);
    pageElement.appendChild(poster(item, left, rowTop, 250, 360, { gold: true }, host));
  }
}

export function buildHomeVodPage(index: number, pageElement: HomeNode, host: HomePageHost): void {
  if (index === 1) {
    const items = host.filterCategory("destacado");
    const visible = items.slice(0, 9);
    const portal = Boolean(visible[0] && visible[0]._portal);
    heroRow(pageElement, visible, { titles: portal, dots: portal ? 4 : 0, shade: portal }, host);
    const rest = items.slice(9);
    if (rest.length) {
      posterRow(pageElement, rest, 860, "Títulos destacados", host);
    }
    return;
  }

  if (index === 2) {
    const items = host.filterCategory("pelicula");
    const visible = items.slice(0, 9);
    const portal = Boolean(visible[0] && visible[0]._portal);
    heroRow(pageElement, visible, { titles: portal, dots: portal ? 4 : 0, shade: portal }, host);
    const rest = items.slice(9);
    if (rest.length) {
      posterRow(pageElement, rest, 860, "Más películas", host);
    }
    return;
  }

  if (index === 3) {
    const items = host.filterCategory("serie");
    const visible = items.slice(0, 9);
    const portal = Boolean(visible[0] && visible[0]._portal);
    heroRow(pageElement, visible, { titles: portal, dots: portal ? 3 : 2, shade: portal }, host);
    const rest = items.slice(9);
    if (rest.length) {
      posterRow(pageElement, rest, 860, "Más series", host);
    }
    return;
  }

  if (index === 4) {
    let items = host.selectPage("infantil", 12, 0);
    if (!items.length) {
      items = host.getCatalog();
    }
    const portal = Boolean(items[0] && items[0]._portal);
    heroRow(pageElement, items.slice(0, 9), { titles: portal, shade: portal }, host);
    const rest = items.slice(9);
    if (rest.length) {
      posterRow(pageElement, rest, 860, "Más para niños", host);
    }
    return;
  }

  if (index === 5) {
    const items = host.filterCategory("anime");
    const visible = items.slice(0, 9);
    const portal = Boolean(visible[0] && visible[0]._portal);
    heroRow(pageElement, visible, { titles: portal, dots: portal ? 3 : 2, shade: portal }, host);
    const rest = items.slice(9);
    if (rest.length) {
      posterRow(pageElement, rest, 860, "Anime y animación", host);
    }
    return;
  }

  if (index === 6) {
    const catalog = host.getCatalog();
    heroRow(pageElement, catalog.slice(0, 9), { titles: false, shade: true }, host);
    const explore = [
      { key: "pelicula", label: "Películas" },
      { key: "serie", label: "Series" },
      { key: "anime", label: "Anime y animación" },
      { key: "infantil", label: "Infantil" },
      { key: "gratis", label: "Gratis" }
    ];
    let y = 811.5;
    for (const category of explore) {
      const items = host.filterCategory(category.key).slice(0, 6);
      if (items.length) {
        posterRow(pageElement, items, y, category.label, host);
        y += 490;
      }
    }
  }
}
