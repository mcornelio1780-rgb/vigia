import express from "express";
import cors from "cors";
import { query } from "./db.js";
import authRouter from "./routes/auth.js";
import leadsRouter from "./routes/leads.js";
import { fetchForecast } from "./weather.js";
import PDFDocument from "pdfkit";
import { buildReportPdf } from "./report.js";

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

  // Genera un PDF de evidencia satelital del campo (para el seguro).
  app.post("/api/report", (req, res) => {
    const data = req.body || {};
    if (!data.farm || typeof data.farm !== "object") {
      return res.status(400).json({ error: "Se requiere el objeto 'farm' del campo" });
    }
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="vigia-reporte.pdf"');
      doc.pipe(res);
      buildReportPdf(doc, data);
      doc.end();
    } catch (err) {
      if (!res.headersSent) res.status(500).json({ error: "No se pudo generar el PDF" });
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
