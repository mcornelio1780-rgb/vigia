import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL || "postgres://vigia:vigia@localhost:5432/vigia",
});

export const query = (text, params) => pool.query(text, params);
