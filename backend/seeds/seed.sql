INSERT INTO categories (slug, name, color) VALUES
  ('seguridad',  'Seguridad',            '#dc2626'),
  ('alumbrado',  'Alumbrado público',    '#f59e0b'),
  ('baches',     'Baches y vialidad',    '#78716c'),
  ('basura',     'Basura y limpieza',    '#16a34a'),
  ('agua',       'Agua y drenaje',       '#2563eb'),
  ('otro',       'Otro',                 '#6b7280')
ON CONFLICT (slug) DO NOTHING;

-- Reportes de ejemplo alrededor del centro de Ciudad de México
INSERT INTO reports (title, description, category_id, status, reporter_name, location)
SELECT * FROM (VALUES
  ('Lámpara fundida en la esquina', 'La luminaria lleva dos semanas sin funcionar y la calle queda muy oscura.',
    (SELECT id FROM categories WHERE slug = 'alumbrado'), 'abierto', 'María G.',
    ST_SetSRID(ST_MakePoint(-99.1332, 19.4326), 4326)::geography),
  ('Bache profundo frente al mercado', 'Un bache de unos 40 cm que ya ha dañado varias llantas.',
    (SELECT id FROM categories WHERE slug = 'baches'), 'en_proceso', 'Carlos R.',
    ST_SetSRID(ST_MakePoint(-99.1405, 19.4290), 4326)::geography),
  ('Acumulación de basura en el parque', 'Bolsas de basura acumuladas desde el fin de semana.',
    (SELECT id FROM categories WHERE slug = 'basura'), 'abierto', NULL,
    ST_SetSRID(ST_MakePoint(-99.1270, 19.4380), 4326)::geography),
  ('Fuga de agua en la banqueta', 'Sale agua constantemente desde hace tres días.',
    (SELECT id FROM categories WHERE slug = 'agua'), 'en_proceso', 'Ana L.',
    ST_SetSRID(ST_MakePoint(-99.1450, 19.4355), 4326)::geography),
  ('Robo de autopartes reportado', 'Vecinos reportan robo de espejos en autos estacionados por la noche.',
    (SELECT id FROM categories WHERE slug = 'seguridad'), 'abierto', NULL,
    ST_SetSRID(ST_MakePoint(-99.1380, 19.4400), 4326)::geography),
  ('Semáforo descompuesto', 'El semáforo del cruce está intermitente desde ayer.',
    (SELECT id FROM categories WHERE slug = 'otro'), 'resuelto', 'Jorge M.',
    ST_SetSRID(ST_MakePoint(-99.1300, 19.4250), 4326)::geography),
  ('Luminaria parpadeante en el andador', 'Parpadea toda la noche y molesta a los vecinos.',
    (SELECT id FROM categories WHERE slug = 'alumbrado'), 'resuelto', NULL,
    ST_SetSRID(ST_MakePoint(-99.1500, 19.4310), 4326)::geography),
  ('Coladera sin tapa', 'Coladera abierta en plena banqueta, es un peligro para peatones.',
    (SELECT id FROM categories WHERE slug = 'agua'), 'abierto', 'Lucía P.',
    ST_SetSRID(ST_MakePoint(-99.1355, 19.4225), 4326)::geography)
) AS v(title, description, category_id, status, reporter_name, location)
WHERE NOT EXISTS (SELECT 1 FROM reports);
