import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { query } from "./db.js";
import reportsRouter from "./routes/reports.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    const { rows } = await query("SELECT PostGIS_Lib_Version() AS postgis");
    res.json({ status: "ok", postgis: rows[0].postgis });
  } catch (err) {
    res.status(503).json({ status: "error", error: err.message });
  }
});

app.get("/api/categories", async (_req, res, next) => {
  try {
    const { rows } = await query("SELECT id, slug, name, color FROM categories ORDER BY id");
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

app.get("/api/stats", async (_req, res, next) => {
  try {
    const [byStatus, byCategory, total] = await Promise.all([
      query("SELECT status, count(*)::int AS count FROM reports GROUP BY status"),
      query(
        `SELECT c.slug, c.name, c.color, count(r.id)::int AS count
         FROM categories c LEFT JOIN reports r ON r.category_id = c.id
         GROUP BY c.id ORDER BY c.id`
      ),
      query("SELECT count(*)::int AS count FROM reports"),
    ]);
    res.json({
      total: total.rows[0].count,
      by_status: byStatus.rows,
      by_category: byCategory.rows,
    });
  } catch (err) {
    next(err);
  }
});

app.use("/api/reports", reportsRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API de Vigia escuchando en http://localhost:${port}`);
});
