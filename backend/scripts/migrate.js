import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../src/db.js";

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();

for (const file of files) {
  const sql = await readFile(join(migrationsDir, file), "utf8");
  console.log(`Aplicando ${file}...`);
  await pool.query(sql);
}

console.log("Migraciones aplicadas.");
await pool.end();
