-- Preferencias del usuario (umbrales de alerta y canales de notificación).
ALTER TABLE users ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb;
