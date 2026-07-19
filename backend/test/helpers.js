import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

// Fuerza la base de PRUEBAS antes de importar la app (db.js lee
// DATABASE_URL al crear el pool). Nunca toca la base de desarrollo.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || "postgres://vigia:vigia@localhost:5432/vigia_test";
process.env.ADMIN_PASSWORD = "test-admin";
process.env.AUTH_SECRET = "test-secret";
process.env.UPLOADS_DIR = join(tmpdir(), "vigia-test-uploads");

const { createApp } = await import("../src/app.js");
const { pool } = await import("../src/db.js");

export { pool };

const here = dirname(fileURLToPath(import.meta.url));

// Coordenadas conocidas para poder verificar los filtros geoespaciales.
export const FIXTURES = {
  cerca: { title: "Cerca A", slug: "alumbrado", status: "abierto", lng: -99.1332, lat: 19.4326 },
  medio: { title: "Cerca B", slug: "baches", status: "en_proceso", lng: -99.1282, lat: 19.4326 }, // ~525 m
  lejos: { title: "Lejos C", slug: "basura", status: "resuelto", lng: -99.2, lat: 19.5 }, // ~10 km
};

// Aplica el esquema y deja exactamente los tres reportes de FIXTURES.
export async function resetDb() {
  for (const file of ["001_init.sql", "002_reports_photo.sql"]) {
    await pool.query(await readFile(join(here, "..", "migrations", file), "utf8"));
  }
  await pool.query(await readFile(join(here, "..", "seeds", "seed.sql"), "utf8")); // categorías
  await pool.query("TRUNCATE reports RESTART IDENTITY");
  for (const f of Object.values(FIXTURES)) {
    await pool.query(
      `INSERT INTO reports (title, category_id, status, location)
       VALUES ($1, (SELECT id FROM categories WHERE slug = $2), $3,
               ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography)`,
      [f.title, f.slug, f.status, f.lng, f.lat]
    );
  }
}

let server;

// Arranca la app en un puerto efímero y devuelve la URL base.
export async function startServer() {
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  return `http://127.0.0.1:${server.address().port}`;
}

export async function stopServer() {
  if (server) await new Promise((resolve) => server.close(resolve));
  await pool.end();
}

// Helper de fetch que devuelve { status, body }.
export async function api(base, path, init) {
  const res = await fetch(`${base}${path}`, init);
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}
