import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Lee el nombre y la versión desde package.json una sola vez al cargar el
// módulo, para exponerlos en /api/version sin acoplar la app al proceso de
// build ni depender de import-assertions.
const here = dirname(fileURLToPath(import.meta.url));

let pkg = { name: "vigia-backend", version: "0.0.0" };
try {
  pkg = JSON.parse(readFileSync(join(here, "..", "package.json"), "utf8"));
} catch {
  // Si no se puede leer, se usan los valores por defecto de arriba.
}

export const name = pkg.name;
export const version = pkg.version;
