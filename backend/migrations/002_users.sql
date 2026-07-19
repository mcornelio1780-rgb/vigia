-- Cuentas de usuario y sus campos guardados.
CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  name          text,
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS farms (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name       text NOT NULL,
  hectares   integer CHECK (hectares IS NULL OR hectares >= 0),
  location   geography(Point, 4326),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS farms_user_idx ON farms (user_id);
CREATE INDEX IF NOT EXISTS farms_location_gix ON farms USING GIST (location);
