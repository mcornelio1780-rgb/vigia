import { Router } from "express";
import { query } from "../db.js";
import { requireAdmin } from "../auth.js";
import { rateLimit } from "../ratelimit.js";
import { isValidEmail, normalizeEmail } from "../validation.js";

const router = Router();
const createLimiter = rateLimit({ windowMs: 60_000, max: 30 });

const KINDS = ["waitlist", "newsletter"];

const LEAD_SELECT = `
  SELECT id, email, kind, name, country, hectares, created_at,
         ST_Y(location::geometry) AS lat,
         ST_X(location::geometry) AS lng
  FROM leads
`;

// GET /api/leads/stats — números públicos para el landing.
router.get("/stats", async (_req, res, next) => {
  try {
    const [byKind, countries] = await Promise.all([
      query("SELECT kind, count(*)::int AS count FROM leads GROUP BY kind"),
      query("SELECT count(DISTINCT country)::int AS count FROM leads WHERE country IS NOT NULL"),
    ]);
    const waitlist = byKind.rows.find((r) => r.kind === "waitlist")?.count ?? 0;
    const newsletter = byKind.rows.find((r) => r.kind === "newsletter")?.count ?? 0;
    res.json({ waitlist, newsletter, total: waitlist + newsletter, countries: countries.rows[0].count });
  } catch (err) {
    next(err);
  }
});

// GET /api/leads — listado (solo administrador), con filtros opcionales
// ?kind y ?country (este último sin distinguir mayúsculas, combinable).
router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const params = [];
    const conds = [];
    if (req.query.kind) {
      if (!KINDS.includes(req.query.kind)) {
        return res.status(400).json({ error: `kind debe ser uno de: ${KINDS.join(", ")}` });
      }
      params.push(req.query.kind);
      conds.push(`kind = $${params.length}`);
    }
    if (req.query.country) {
      params.push(String(req.query.country).trim().toLowerCase());
      conds.push(`LOWER(country) = $${params.length}`);
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const offset = Number(req.query.offset) || 0;
    params.push(limit, offset);
    const { rows } = await query(
      `${LEAD_SELECT} ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/leads — alta pública (lista de espera o boletín). Idempotente
// por (email, kind): un segundo envío actualiza los datos, no duplica.
router.post("/", createLimiter, async (req, res, next) => {
  try {
    const { email, kind = "waitlist", name, country, hectares, lat, lng } = req.body || {};
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "email inválido" });
    }
    const mail = normalizeEmail(email);
    if (!KINDS.includes(kind)) {
      return res.status(400).json({ error: `kind debe ser uno de: ${KINDS.join(", ")}` });
    }
    let ha = null;
    if (hectares != null && hectares !== "") {
      ha = Number(hectares);
      if (!Number.isFinite(ha) || ha < 0) {
        return res.status(400).json({ error: "hectares debe ser un número positivo" });
      }
      ha = Math.round(ha);
    }
    // Ubicación opcional del campo.
    let point = null;
    if (lat != null && lng != null && lat !== "" && lng !== "") {
      const latN = Number(lat);
      const lngN = Number(lng);
      if (Number.isNaN(latN) || Number.isNaN(lngN) || latN < -90 || latN > 90 || lngN < -180 || lngN > 180) {
        return res.status(400).json({ error: "lat y lng deben ser coordenadas válidas" });
      }
      point = { latN, lngN };
    }

    const { rows } = await query(
      `INSERT INTO leads (email, kind, name, country, hectares, location)
       VALUES ($1, $2, $3, $4, $5, ${point ? "ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography" : "NULL"})
       ON CONFLICT (email, kind) DO UPDATE
         SET name = COALESCE(EXCLUDED.name, leads.name),
             country = COALESCE(EXCLUDED.country, leads.country),
             hectares = COALESCE(EXCLUDED.hectares, leads.hectares),
             location = COALESCE(EXCLUDED.location, leads.location)
       RETURNING id`,
      point
        ? [mail, kind, name || null, country || null, ha, point.lngN, point.latN]
        : [mail, kind, name || null, country || null, ha]
    );
    const created = await query(`${LEAD_SELECT} WHERE id = $1`, [rows[0].id]);
    res.status(201).json(created.rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
