import { Router } from "express";
import { query } from "../db.js";
import { issueToken, requireUser } from "../auth.js";
import { hashPassword, verifyPassword } from "../passwords.js";
import { rateLimit } from "../ratelimit.js";

const router = Router();
const authLimiter = rateLimit({ windowMs: 60_000, max: 15 });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FARM_SELECT = `
  SELECT id, name, hectares, created_at,
         ST_Y(location::geometry) AS lat,
         ST_X(location::geometry) AS lng
  FROM farms
`;

// POST /api/users/signup { email, password, name } -> { user, token }
router.post("/signup", authLimiter, async (req, res, next) => {
  try {
    const { email, password, name } = req.body || {};
    const mail = String(email || "").trim().toLowerCase();
    if (!mail || !EMAIL_RE.test(mail)) return res.status(400).json({ error: "email inválido" });
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: "la contraseña debe tener al menos 6 caracteres" });
    }
    const exists = await query("SELECT 1 FROM users WHERE email = $1", [mail]);
    if (exists.rows.length) return res.status(409).json({ error: "ese correo ya está registrado" });

    const { rows } = await query(
      "INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name",
      [mail, name || null, hashPassword(password)]
    );
    const user = rows[0];
    res.status(201).json({ user, ...issueToken({ role: "user", sub: user.id }) });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/login { email, password } -> { user, token }
router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const mail = String(email || "").trim().toLowerCase();
    const { rows } = await query(
      "SELECT id, email, name, password_hash FROM users WHERE email = $1",
      [mail]
    );
    const u = rows[0];
    if (!u || !verifyPassword(password, u.password_hash)) {
      return res.status(401).json({ error: "correo o contraseña incorrectos" });
    }
    const user = { id: u.id, email: u.email, name: u.name };
    res.json({ user, ...issueToken({ role: "user", sub: user.id }) });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me -> { user, farms }
router.get("/me", requireUser, async (req, res, next) => {
  try {
    const u = await query("SELECT id, email, name FROM users WHERE id = $1", [req.user.id]);
    if (!u.rows.length) return res.status(404).json({ error: "usuario no encontrado" });
    const farms = await query(`${FARM_SELECT} WHERE user_id = $1 ORDER BY created_at`, [req.user.id]);
    res.json({ user: u.rows[0], farms: farms.rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/farms -> [ ... ]
router.get("/farms", requireUser, async (req, res, next) => {
  try {
    const { rows } = await query(`${FARM_SELECT} WHERE user_id = $1 ORDER BY created_at`, [req.user.id]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/users/farms { name, lat, lng, hectares } -> farm
router.post("/farms", requireUser, async (req, res, next) => {
  try {
    const { name, lat, lng, hectares } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ error: "name es obligatorio" });

    let point = null;
    if (lat != null && lng != null && lat !== "" && lng !== "") {
      const latN = Number(lat);
      const lngN = Number(lng);
      if (Number.isNaN(latN) || Number.isNaN(lngN) || latN < -90 || latN > 90 || lngN < -180 || lngN > 180) {
        return res.status(400).json({ error: "lat y lng deben ser coordenadas válidas" });
      }
      point = { latN, lngN };
    }
    let ha = null;
    if (hectares != null && hectares !== "") {
      ha = Number(hectares);
      if (!Number.isFinite(ha) || ha < 0) return res.status(400).json({ error: "hectares inválido" });
      ha = Math.round(ha);
    }

    const { rows } = await query(
      `INSERT INTO farms (user_id, name, hectares, location)
       VALUES ($1, $2, $3, ${point ? "ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography" : "NULL"})
       RETURNING id`,
      point ? [req.user.id, String(name).trim(), ha, point.lngN, point.latN] : [req.user.id, String(name).trim(), ha]
    );
    const created = await query(`${FARM_SELECT} WHERE id = $1`, [rows[0].id]);
    res.status(201).json(created.rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
