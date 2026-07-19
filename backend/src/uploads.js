import { mkdirSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import multer from "multer";

export const UPLOADS_DIR =
  process.env.UPLOADS_DIR || join(dirname(fileURLToPath(import.meta.url)), "..", "uploads");

mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase().slice(0, 10) || ".jpg";
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) return cb(null, true);
    cb(Object.assign(new Error("Formato de imagen no permitido (usa JPG, PNG, WEBP o GIF)"), { status: 400 }));
  },
});
