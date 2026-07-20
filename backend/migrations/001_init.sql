CREATE EXTENSION IF NOT EXISTS postgis;

-- Captura de interés del landing de Vigia: lista de espera y boletín.
-- La ubicación del campo (opcional) se guarda como geografía para poder
-- hacer consultas geoespaciales de cobertura por país/región.
CREATE TABLE IF NOT EXISTS leads (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  kind       text NOT NULL CHECK (kind IN ('waitlist', 'newsletter')),
  name       text,
  country    text,
  hectares   integer CHECK (hectares IS NULL OR hectares >= 0),
  location   geography(Point, 4326),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, kind)
);

CREATE INDEX IF NOT EXISTS leads_location_gix ON leads USING GIST (location);
CREATE INDEX IF NOT EXISTS leads_kind_idx ON leads (kind);
CREATE INDEX IF NOT EXISTS leads_created_idx ON leads (created_at DESC);
