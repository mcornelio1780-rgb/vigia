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

// Preferencias del usuario: valores por defecto, rangos y saneo.
const SETTING_DEFAULTS = {
  thFire: 60, thFlood: 50, thDrought: 40, thWind: 50,
  wa: true, sms: true, mail: true, push: false,
  daily: true, weekly: true, autoPdf: true, insCopy: false,
};
const NUM_RANGES = { thFire: [20, 95], thFlood: [10, 200], thDrought: [10, 90], thWind: [20, 120] };
const BOOL_KEYS = ["wa", "sms", "mail", "push", "daily", "weekly", "autoPdf", "insCopy"];

function sanitizeSettings(input) {
  const out = {};
  if (input && typeof input === "object") {
    for (const [k, [min, max]] of Object.entries(NUM_RANGES)) {
      if (input[k] != null) {
        const n = Number(input[k]);
        if (Number.isFinite(n)) out[k] = Math.min(max, Math.max(min, Math.round(n)));
      }
    }
    for (const k of BOOL_KEYS) {
      if (typeof input[k] === "boolean") out[k] = input[k];
    }
  }
  return out;
}

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

// PUT /api/users/me { name } -> actualiza el nombre del perfil
router.put("/me", requireUser, async (req, res, next) => {
  try {
    const { name } = req.body || {};
    const clean = name == null ? null : String(name).trim();
    if (clean != null && clean.length > 120) {
      return res.status(400).json({ error: "el nombre es demasiado largo (máx. 120)" });
    }
    const { rows } = await query(
      "UPDATE users SET name = $1 WHERE id = $2 RETURNING id, email, name",
      [clean || null, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: "usuario no encontrado" });
    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/me -> elimina la cuenta y sus campos (la FK farms.user_id
// es ON DELETE CASCADE, así que borrar el usuario arrastra sus campos).
router.delete("/me", requireUser, async (req, res, next) => {
  try {
    const { rowCount } = await query("DELETE FROM users WHERE id = $1", [req.user.id]);
    if (!rowCount) return res.status(404).json({ error: "usuario no encontrado" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/export -> descarga JSON con todos los datos del usuario
// (perfil + campos + preferencias). Portabilidad de datos para el productor.
router.get("/export", requireUser, async (req, res, next) => {
  try {
    const u = await query("SELECT id, email, name, settings, created_at FROM users WHERE id = $1", [req.user.id]);
    if (!u.rows.length) return res.status(404).json({ error: "usuario no encontrado" });
    const farms = await query(`${FARM_SELECT} WHERE user_id = $1 ORDER BY created_at`, [req.user.id]);
    const { settings, ...user } = u.rows[0];
    res.setHeader("Content-Disposition", 'attachment; filename="vigia-datos.json"');
    res.json({
      exportedAt: new Date().toISOString(),
      user,
      farms: farms.rows,
      settings: { ...SETTING_DEFAULTS, ...(settings || {}) },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/password { current, next } -> cambia la contraseña
router.put("/password", authLimiter, requireUser, async (req, res, next) => {
  try {
    const { current, next: newPassword } = req.body || {};
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ error: "la nueva contraseña debe tener al menos 6 caracteres" });
    }
    const { rows } = await query("SELECT password_hash FROM users WHERE id = $1", [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: "usuario no encontrado" });
    if (!verifyPassword(current, rows[0].password_hash)) {
      return res.status(401).json({ error: "la contraseña actual es incorrecta" });
    }
    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [hashPassword(String(newPassword)), req.user.id]);
    res.json({ ok: true });
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

// PUT /api/users/farms/:id { name, hectares?, lat?, lng? } -> edita un campo
// propio. Actualización parcial: solo cambia lo que se envía (editar el nombre
// no borra la ubicación ni las hectáreas ya guardadas).
router.put("/farms/:id", requireUser, async (req, res, next) => {
  try {
    const { name, lat, lng, hectares } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ error: "name es obligatorio" });

    const sets = ["name = $1"];
    const params = [String(name).trim()];

    if (hectares !== undefined) {
      if (hectares === null || hectares === "") {
        sets.push("hectares = NULL");
      } else {
        const ha = Number(hectares);
        if (!Number.isFinite(ha) || ha < 0) return res.status(400).json({ error: "hectares inválido" });
        params.push(Math.round(ha));
        sets.push(`hectares = $${params.length}`);
      }
    }

    if (lat !== undefined || lng !== undefined) {
      if (lat === null || lng === null || lat === "" || lng === "") {
        sets.push("location = NULL");
      } else {
        const latN = Number(lat);
        const lngN = Number(lng);
        if (Number.isNaN(latN) || Number.isNaN(lngN) || latN < -90 || latN > 90 || lngN < -180 || lngN > 180) {
          return res.status(400).json({ error: "lat y lng deben ser coordenadas válidas" });
        }
        params.push(lngN);
        const lngIdx = params.length;
        params.push(latN);
        const latIdx = params.length;
        sets.push(`location = ST_SetSRID(ST_MakePoint($${lngIdx}, $${latIdx}), 4326)::geography`);
      }
    }

    params.push(req.params.id);
    const idIdx = params.length;
    params.push(req.user.id);
    const uidIdx = params.length;

    const { rows } = await query(
      `UPDATE farms SET ${sets.join(", ")} WHERE id = $${idIdx} AND user_id = $${uidIdx} RETURNING id`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: "Campo no encontrado" });
    const updated = await query(`${FARM_SELECT} WHERE id = $1`, [rows[0].id]);
    res.json(updated.rows[0]);
  } catch (err) {
    if (err.code === "22P02") return res.status(400).json({ error: "id inválido" });
    next(err);
  }
});

// DELETE /api/users/farms/:id -> borra un campo del propio usuario
router.delete("/farms/:id", requireUser, async (req, res, next) => {
  try {
    const { rowCount } = await query("DELETE FROM farms WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
    if (!rowCount) return res.status(404).json({ error: "Campo no encontrado" });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === "22P02") return res.status(400).json({ error: "id inválido" });
    next(err);
  }
});

// GET /api/users/settings -> preferencias (con valores por defecto)
router.get("/settings", requireUser, async (req, res, next) => {
  try {
    const { rows } = await query("SELECT settings FROM users WHERE id = $1", [req.user.id]);
    res.json({ ...SETTING_DEFAULTS, ...(rows[0]?.settings || {}) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/settings { settings } -> guarda (fusiona) y devuelve el resultado
router.put("/settings", requireUser, async (req, res, next) => {
  try {
    const clean = sanitizeSettings(req.body?.settings ?? req.body);
    const cur = await query("SELECT settings FROM users WHERE id = $1", [req.user.id]);
    const merged = { ...(cur.rows[0]?.settings || {}), ...clean };
    await query("UPDATE users SET settings = $1::jsonb WHERE id = $2", [JSON.stringify(merged), req.user.id]);
    res.json({ ...SETTING_DEFAULTS, ...merged });
  } catch (err) {
    next(err);
  }
});

export default router;
