import express from "express";
import cors from "cors";
import { query } from "./db.js";
import authRouter from "./routes/auth.js";
import leadsRouter from "./routes/leads.js";
import { fetchForecast } from "./weather.js";

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

  // Pronóstico real del campo (Open-Meteo). Si la red no está disponible
  // devuelve 502 y el frontend recurre a su serie de demostración.
  app.get("/api/weather", async (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: "lat y lng deben ser coordenadas válidas" });
    }
    try {
      const days = await fetchForecast(lat, lng);
      res.json({ source: "open-meteo", days });
    } catch {
      res.status(502).json({ error: "Clima en vivo no disponible" });
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
