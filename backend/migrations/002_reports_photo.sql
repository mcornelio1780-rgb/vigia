-- Foto opcional asociada a un reporte (ruta servida por /uploads).
ALTER TABLE reports ADD COLUMN IF NOT EXISTS photo_url text;
