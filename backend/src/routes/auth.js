import { Router } from "express";
import { checkPassword, issueToken, requireAdmin } from "../auth.js";

const router = Router();

// POST /api/auth/login  { password } -> { token, expires_at }
router.post("/login", (req, res) => {
  const { password } = req.body || {};
  if (!checkPassword(password)) {
    return res.status(401).json({ error: "Contraseña incorrecta" });
  }
  res.json({ role: "admin", ...issueToken("admin") });
});

// GET /api/auth/me  -> confirma que el token sigue siendo válido
router.get("/me", requireAdmin, (req, res) => {
  res.json({ role: req.user.role, exp: req.user.exp });
});

export default router;
