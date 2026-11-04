import { createAppState } from "../runtime/state";

export const PROFILE_KEY = "xuper_local_profile_v1";
export const PLAYBACK_KEY = "xuper_global_playback_v1";
export const PORTAL_ROOTS = ["featured", "movies", "series", "anime", "kids", "free"];

export const HOME_ICONS = {
  tv: '<svg viewBox="0 0 33 33"><rect x="3.5" y="7" width="26" height="17" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M11 24.5v3h11v-3" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
  thumb: '<svg viewBox="0 0 33 33"><path d="M12 15.5V28H7.6A2.6 2.6 0 0 1 5 25.4v-7.3a2.6 2.6 0 0 1 2.6-2.6H12z" fill="currentColor"/><path d="M14 15.6l4.3-9.2a2.2 2.2 0 0 1 4 1.6V13h5.6a2.9 2.9 0 0 1 2.8 3.6l-2 9A3.4 3.4 0 0 1 25.4 28H14z" fill="currentColor"/></svg>',
  film: '<svg viewBox="0 0 33 33"><circle cx="16.5" cy="16.5" r="11.5" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="16.5" cy="16.5" r="2.4" fill="currentColor"/><circle cx="16.5" cy="9.5" r="2.1" fill="currentColor"/><circle cx="16.5" cy="23.5" r="2.1" fill="currentColor"/><circle cx="9.5" cy="16.5" r="2.1" fill="currentColor"/><circle cx="23.5" cy="16.5" r="2.1" fill="currentColor"/></svg>',
  strip: '<svg viewBox="0 0 33 33"><rect x="4" y="7" width="25" height="19" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M9 7v19M24 7v19" stroke="currentColor" stroke-width="1.8"/><rect x="5.6" y="9" width="2.4" height="2.6" fill="currentColor"/><rect x="5.6" y="15.2" width="2.4" height="2.6" fill="currentColor"/><rect x="5.6" y="21.4" width="2.4" height="2.6" fill="currentColor"/><rect x="25" y="9" width="2.4" height="2.6" fill="currentColor"/><rect x="25" y="15.2" width="2.4" height="2.6" fill="currentColor"/><rect x="25" y="21.4" width="2.4" height="2.6" fill="currentColor"/></svg>',
  kids: '<svg viewBox="0 0 33 33"><circle cx="8.6" cy="8.6" r="4" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="24.4" cy="8.6" r="4" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="16.5" cy="18" r="9.6" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="13" cy="17" r="1.5" fill="currentColor"/><circle cx="20" cy="17" r="1.5" fill="currentColor"/><ellipse cx="16.5" cy="21.6" rx="2.4" ry="1.7" fill="currentColor"/></svg>',
  anime: '<svg viewBox="0 0 33 33"><circle cx="8.5" cy="9" r="4.5" fill="currentColor"/><circle cx="24.5" cy="9" r="4.5" fill="currentColor"/><path d="M16.5 9c5.8 0 10.5 4.6 10.5 10.3 0 5.7-4.7 9.7-10.5 9.7S6 25 6 19.3C6 13.6 10.7 9 16.5 9z" fill="currentColor"/><circle cx="12.5" cy="18" r="1.6" fill="#0b0b0b"/><circle cx="20.5" cy="18" r="1.6" fill="#0b0b0b"/><ellipse cx="16.5" cy="23" rx="3" ry="2" fill="#0b0b0b"/></svg>',
  compass: '<svg viewBox="0 0 33 33"><circle cx="16.5" cy="16.5" r="11.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M22 11l-3.2 7.8L11 22l3.2-7.8z" fill="currentColor"/></svg>'
};

export const HOME_TABS = [
  { label: "TV", page: 0, icon: "tv" },
  { label: "DESTACADOS", page: 1, icon: "thumb" },
  { label: "PELICULA", page: 2, icon: "film" },
  { label: "SERIES", page: 3, icon: "strip" },
  { label: "KIDS", page: 4, icon: "kids" },
  { label: "ANIME", page: 5, icon: "anime" },
  { label: "EXPLORAR", page: 6, icon: "compass" }
];

const GENRES = ["Acción", "Drama", "Comedia", "Suspenso", "Aventura", "Animación", "Familiar", "Ciencia ficción"];
const CATEGORY_KEYS = {
  Destacado: "destacado",
  "Película": "pelicula",
  Serie: "serie",
  Gratis: "gratis",
  Infantil: "infantil",
  UHD: "uhd",
  Extra: "extra"
};

function pad(value) {
  return value < 10 ? "0" + value : "" + value;
}

function seed(catalog, name, count, offset) {
  for (let index = 1; index <= count; index++) {
    const first = GENRES[(offset + index) % GENRES.length];
    const second = GENRES[(offset + index + 3) % GENRES.length];
    catalog.push({
      id: catalog.length + 1,
      title: name + " demo " + pad(index),
      category: CATEGORY_KEYS[name] || "",
      score: (7.9 + (offset + index) % 16 / 10).toFixed(1),
      year: 2018 + (offset + index) % 7,
      duration: 1 + (offset + index) % 2 + " h " + (10 + (7 * offset + 5 * index) % 45) + " min",
      genres: first === second ? [first] : [first, second],
      director: "Director demo " + pad(index),
      actors: "Actor demo " + pad(index) + ", Actriz demo " + pad(index + 1),
      synopsis: "Sinopsis de demostración para " + name.toLowerCase() + " demo " + pad(index) + '. Este texto sólo existe para comprobar el recorte a dos líneas, el interlineado y la sangría de la etiqueta "Sinopsis :" definidos en activity_voddetails.',
      kind: name.toLowerCase()
    });
  }
}

export function createLegacyCatalog() {
  const catalog = [];
  seed(catalog, "Destacado", 5, 1);
  seed(catalog, "Película", 7, 2);
  seed(catalog, "Serie", 7, 3);
  seed(catalog, "Gratis", 5, 4);
  seed(catalog, "Infantil", 8, 5);
  seed(catalog, "UHD", 4, 6);
  seed(catalog, "Extra", 4, 7);
  return catalog;
}

export function createLegacyAppState() {
  return createAppState();
}

export function createInitialProfile() {
  return {
    id: "",
    createdAt: 0,
    history: [],
    reminders: {},
    reminderCheckAt: 0
  };
}
