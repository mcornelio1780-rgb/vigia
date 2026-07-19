import { Router } from "express";
import { query } from "../db.js";
import { requireAdmin } from "../auth.js";

const router = Router();

const REPORT_SELECT = `
  SELECT r.id, r.title, r.description, r.status, r.reporter_name, r.photo_url,
         r.created_at, r.updated_at,
         ST_Y(r.location::geometry) AS lat,
         ST_X(r.location::geometry) AS lng,
         json_build_object('id', c.id, 'slug', c.slug, 'name', c.name, 'color', c.color) AS category
  FROM reports r
  JOIN categories c ON c.id = r.category_id
`;

// Construye WHERE + params a partir de los filtros de la query string.
// Filtros: category (slug), status, bbox=minLng,minLat,maxLng,maxLat,
// near=lng,lat + radius (metros, por defecto 1000).
function buildFilters(q) {
  const where = [];
  const params = [];

  if (q.category) {
    params.push(q.category);
    where.push(`c.slug = $${params.length}`);
  }
  if (q.status) {
    params.push(q.status);
    where.push(`r.status = $${params.length}`);
  }
  if (q.bbox) {
    const parts = String(q.bbox).split(",").map(Number);
    if (parts.length !== 4 || parts.some(Number.isNaN)) {
      throw Object.assign(new Error("bbox debe ser minLng,minLat,maxLng,maxLat"), { status: 400 });
    }
    params.push(...parts);
    const n = params.length;
    where.push(
      `r.location && ST_MakeEnvelope($${n - 3}, $${n - 2}, $${n - 1}, $${n}, 4326)::geography`
    );
  }
  if (q.near) {
    const parts = String(q.near).split(",").map(Number);
    if (parts.length !== 2 || parts.some(Number.isNaN)) {
      throw Object.assign(new Error("near debe ser lng,lat"), { status: 400 });
    }
    const radius = q.radius ? Number(q.radius) : 1000;
    if (Number.isNaN(radius) || radius <= 0) {
      throw Object.assign(new Error("radius debe ser un número positivo en metros"), { status: 400 });
    }
    params.push(parts[0], parts[1], radius);
    const n = params.length;
    where.push(
      `ST_DWithin(r.location, ST_SetSRID(ST_MakePoint($${n - 2}, $${n - 1}), 4326)::geography, $${n})`
    );
  }

  return { where: where.length ? `WHERE ${where.join(" AND ")}` : "", params };
}

router.get("/", async (req, res, next) => {
  try {
    const { where, params } = buildFilters(req.query);
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const offset = Number(req.query.offset) || 0;
    params.push(limit, offset);
    const { rows } = await query(
      `${REPORT_SELECT} ${where}
       ORDER BY r.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json(rows);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.get("/geojson", async (req, res, next) => {
  try {
    const { where, params } = buildFilters(req.query);
    const { rows } = await query(
      `SELECT json_build_object(
         'type', 'FeatureCollection',
         'features', COALESCE(json_agg(json_build_object(
           'type', 'Feature',
           'geometry', ST_AsGeoJSON(r.location)::json,
           'properties', json_build_object(
             'id', r.id, 'title', r.title, 'status', r.status,
             'category', c.slug, 'color', c.color, 'created_at', r.created_at
           )
         )), '[]'::json)
       ) AS fc
       FROM reports r JOIN categories c ON c.id = r.category_id ${where}`,
      params
    );
    res.json(rows[0].fc);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await query(`${REPORT_SELECT} WHERE r.id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Reporte no encontrado" });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === "22P02") return res.status(400).json({ error: "id inválido" });
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { title, description, category, lat, lng, reporter_name, photo_url } = req.body || {};
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "title es obligatorio" });
    }
    if (!category) {
      return res.status(400).json({ error: "category (slug) es obligatorio" });
    }
    const latN = Number(lat);
    const lngN = Number(lng);
    if (Number.isNaN(latN) || Number.isNaN(lngN) || latN < -90 || latN > 90 || lngN < -180 || lngN > 180) {
      return res.status(400).json({ error: "lat y lng deben ser coordenadas válidas" });
    }
    // Solo se aceptan rutas relativas subidas vía /api/uploads, no URLs arbitrarias.
    if (photo_url != null && !(typeof photo_url === "string" && photo_url.startsWith("/uploads/"))) {
      return res.status(400).json({ error: "photo_url debe ser una ruta /uploads/... devuelta por /api/uploads" });
    }

    const cat = await query("SELECT id FROM categories WHERE slug = $1", [category]);
    if (!cat.rows.length) {
      return res.status(400).json({ error: `Categoría desconocida: ${category}` });
    }

    const { rows } = await query(
      `INSERT INTO reports (title, description, category_id, reporter_name, photo_url, location)
       VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography)
       RETURNING id`,
      [title.trim(), description || null, cat.rows[0].id, reporter_name || null, photo_url || null, lngN, latN]
    );
    const created = await query(`${REPORT_SELECT} WHERE r.id = $1`, [rows[0].id]);
    res.status(201).json(created.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/status", requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body || {};
    const allowed = ["abierto", "en_proceso", "resuelto"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `status debe ser uno de: ${allowed.join(", ")}` });
    }
    const { rows } = await query(
      "UPDATE reports SET status = $1, updated_at = now() WHERE id = $2 RETURNING id",
      [status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Reporte no encontrado" });
    const updated = await query(`${REPORT_SELECT} WHERE r.id = $1`, [rows[0].id]);
    res.json(updated.rows[0]);
  } catch (err) {
    if (err.code === "22P02") return res.status(400).json({ error: "id inválido" });
    next(err);
  }
});

export default router;
