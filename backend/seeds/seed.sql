-- Interés de ejemplo en la lista de espera y el boletín, repartido por
-- varios países para que las estadísticas del landing tengan vida.
INSERT INTO leads (email, kind, name, country, hectares, location)
SELECT * FROM (VALUES
  ('maria@campo.ar',     'waitlist',   'María Fernández', 'Argentina', 480,  ST_SetSRID(ST_MakePoint(-64.35, -33.13), 4326)::geography),
  ('john@story.us',      'waitlist',   'John Meyer',      'USA',       640,  ST_SetSRID(ST_MakePoint(-93.62, 42.03), 4326)::geography),
  ('lucas@sorriso.br',   'waitlist',   'Lucas Almeida',   'Brasil',    2100, ST_SetSRID(ST_MakePoint(-55.70, -12.53), 4326)::geography),
  ('harpreet@ludhiana.in','waitlist',  'Harpreet Singh',  'India',     96,   ST_SetSRID(ST_MakePoint(75.85, 30.90), 4326)::geography),
  ('nuria@ecija.es',     'waitlist',   'Núria Vidal',     'España',    310,  ST_SetSRID(ST_MakePoint(-5.07, 37.53), 4326)::geography),
  ('tom@riverina.au',    'waitlist',   'Tom Harding',     'Australia', 1240, ST_SetSRID(ST_MakePoint(146.05, -34.28), 4326)::geography),
  ('ana@newsletter.mx',  'newsletter', NULL,              'México',    NULL, NULL),
  ('pedro@newsletter.pe','newsletter', NULL,              'Perú',      NULL, NULL)
) AS v(email, kind, name, country, hectares, location)
WHERE NOT EXISTS (SELECT 1 FROM leads);
