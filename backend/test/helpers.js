import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Fuerza la base de PRUEBAS antes de importar la app (db.js lee
// DATABASE_URL al crear el pool). Nunca toca la base de desarrollo.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || "postgres://vigia:vigia@localhost:5432/vigia_test";
process.env.ADMIN_PASSWORD = "test-admin";
process.env.AUTH_SECRET = "test-secret";

const { createApp } = await import("../src/app.js");
const { pool } = await import("../src/db.js");

export { pool };

const here = dirname(fileURLToPath(import.meta.url));

// Aplica el esquema y deja la tabla de leads vacía.
export async function resetDb() {
  await pool.query(await readFile(join(here, "..", "migrations", "001_init.sql"), "utf8"));
  await pool.query("TRUNCATE leads RESTART IDENTITY");
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

export function json(method, payload, headers) {
  return { method, headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(payload) };
}
