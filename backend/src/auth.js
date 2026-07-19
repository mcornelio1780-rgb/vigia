import crypto from "node:crypto";

// Autenticación mínima de administrador sin dependencias externas:
// un token firmado con HMAC-SHA256 usando AUTH_SECRET. Suficiente para
// distinguir a un administrador (que puede cambiar el estado de los
// reportes) de un ciudadano anónimo.

const SECRET = process.env.AUTH_SECRET || "dev-secret-change-me";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "vigia-admin";
const TTL_SECONDS = 60 * 60 * 8; // 8 horas

function base64url(buf) {
  return Buffer.from(buf).toString("base64url");
}

function sign(data) {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function checkPassword(password) {
  const a = Buffer.from(String(password ?? ""));
  const b = Buffer.from(ADMIN_PASSWORD);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function issueToken(role = "admin") {
  const payload = { role, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS };
  const body = base64url(JSON.stringify(payload));
  return { token: `${body}.${sign(body)}`, expires_at: payload.exp };
}

export function verifyToken(token) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [body, mac] = token.split(".");
  const expected = sign(body);
  const macBuf = Buffer.from(mac ?? "");
  const expBuf = Buffer.from(expected);
  if (macBuf.length !== expBuf.length || !crypto.timingSafeEqual(macBuf, expBuf)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// Middleware Express: exige un token de administrador válido en el header
// Authorization: Bearer <token>.
export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const payload = token && verifyToken(token);
  if (!payload || payload.role !== "admin") {
    return res.status(401).json({ error: "Se requiere autenticación de administrador" });
  }
  req.user = payload;
  next();
}
