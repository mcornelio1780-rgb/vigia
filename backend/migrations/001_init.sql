CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS categories (
  id    serial PRIMARY KEY,
  slug  text NOT NULL UNIQUE,
  name  text NOT NULL,
  color text NOT NULL DEFAULT '#6b7280'
);

CREATE TABLE IF NOT EXISTS reports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  description   text,
  category_id   integer NOT NULL REFERENCES categories (id),
  status        text NOT NULL DEFAULT 'abierto'
                CHECK (status IN ('abierto', 'en_proceso', 'resuelto')),
  reporter_name text,
  location      geography(Point, 4326) NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reports_location_gix ON reports USING GIST (location);
CREATE INDEX IF NOT EXISTS reports_category_idx ON reports (category_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports (status);
