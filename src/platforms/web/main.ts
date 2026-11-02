import { filterCatalogByQuery } from "../../core/usecases/catalog/filterCatalog";

const app = document.querySelector<HTMLDivElement>("#app");

if (app) {
  const result = filterCatalogByQuery(
    [{ id: "demo", title: "Demo", kind: "movie" }],
    "demo"
  );

  app.textContent = `TutyTV modular web shell - core online (${result.length})`;
}
