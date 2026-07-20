// Rate limiting en memoria (ventana fija por IP). Suficiente para proteger
// los endpoints públicos de escritura de abuso básico sin dependencias.
// Para varias instancias conviene un store compartido (Redis); aquí es
// por proceso.
export function rateLimit({ windowMs = 60_000, max = 30 } = {}) {
  // RATE_LIMIT_MAX permite subir el cupo en tests (donde muchas llamadas
  // vienen de la misma IP en segundos) sin tocar la protección de producción.
  const effectiveMax = process.env.RATE_LIMIT_MAX ? Number(process.env.RATE_LIMIT_MAX) : max;
  const hits = new Map(); // ip -> { count, resetAt }

  return function rateLimiter(req, res, next) {
    const now = Date.now();
    const ip = req.ip || req.socket?.remoteAddress || "unknown";

    let entry = hits.get(ip);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(ip, entry);
    }
    entry.count++;

    // Limpieza oportunista de entradas vencidas.
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }

    res.setHeader("X-RateLimit-Limit", effectiveMax);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, effectiveMax - entry.count));

    if (entry.count > effectiveMax) {
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({ error: "Demasiadas solicitudes, intenta de nuevo en un momento" });
    }
    next();
  };
}
