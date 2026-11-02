import { filterCatalogByQuery } from "../../core/usecases/catalog/filterCatalog";

(function bootstrapWebOSBuild() {
  const result = filterCatalogByQuery(
    [{ id: "demo", title: "Demo", kind: "movie" }],
    "demo"
  );

  // This bundle is intentionally side-effect light for initial migration.
  (globalThis as { TUTY_WEBOS_BOOT?: number }).TUTY_WEBOS_BOOT = result.length;
})();
