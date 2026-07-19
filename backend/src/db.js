import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString =
  process.env.DATABASE_URL || "postgres://vigia:vigia@localhost:5432/vigia";

// Muchos Postgres gestionados (Render, Neon, Fly, Supabase) exigen TLS en la
// conexión pública. Se activa con DATABASE_SSL=true o si la URL pide
// sslmode=require. En local, tests y CI queda desactivado (comportamiento
// idéntico al anterior).
const useSsl =
  process.env.DATABASE_SSL === "true" || /sslmode=require/.test(connectionString);

export const pool = new pg.Pool({
  connectionString,
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

export const query = (text, params) => pool.query(text, params);
