// Validación y normalización de correos, compartida por leads y usuarios,
// para no repetir regex ad-hoc. Más estricta que un simple `algo@algo.algo`:
// exige exactamente un @, sin espacios, dominio con TLD de 2+ letras y sin
// puntos dobles ni al inicio/fin de cada parte.

export function normalizeEmail(x) {
  return String(x ?? "").trim().toLowerCase();
}

// Sanea un nombre opcional (perfil de usuario, nombre de campo, etc.).
// Devuelve { ok, value, error }:
//   - null / undefined / "" (o solo espacios) -> { ok: true, value: null }
//   - 1..120 chars tras recortar               -> { ok: true, value: <recortado> }
//   - más de 120 chars                          -> { ok: false, error }
export function cleanName(x, max = 120) {
  if (x == null) return { ok: true, value: null };
  const value = String(x).trim();
  if (value === "") return { ok: true, value: null };
  if (value.length > max) return { ok: false, error: `el nombre es demasiado largo (máx. ${max})` };
  return { ok: true, value };
}

const LOCAL_RE = /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+$/;
const DOMAIN_RE = /^[a-z0-9.-]+$/;

export function isValidEmail(x) {
  const email = normalizeEmail(x);
  if (!email || email.length > 254 || /\s/.test(email)) return false;

  const parts = email.split("@");
  if (parts.length !== 2) return false; // exactamente un @
  const [local, domain] = parts;
  if (!local || !domain || local.length > 64) return false;

  // Sin puntos dobles ni al inicio/fin en la parte local y el dominio.
  for (const p of [local, domain]) {
    if (p.startsWith(".") || p.endsWith(".") || p.includes("..")) return false;
  }
  if (!LOCAL_RE.test(local) || !DOMAIN_RE.test(domain)) return false;

  // Dominio con al menos un punto, etiquetas sin guiones colgantes y TLD
  // de 2 o más letras.
  const labels = domain.split(".");
  if (labels.length < 2) return false;
  if (labels.some((l) => l.length === 0 || l.startsWith("-") || l.endsWith("-"))) return false;
  return /^[a-z]{2,}$/.test(labels[labels.length - 1]);
}
