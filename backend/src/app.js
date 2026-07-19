import express from "express";
import cors from "cors";
import { query } from "./db.js";
import authRouter from "./routes/auth.js";
import leadsRouter from "./routes/leads.js";

// Construye la app de Express sin arrancar el servidor, para poder
// importarla desde los tests.
export function createApp() {
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

  app.use("/api/auth", authRouter);
  app.use("/api/leads", leadsRouter);

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  });

  return app;
}
