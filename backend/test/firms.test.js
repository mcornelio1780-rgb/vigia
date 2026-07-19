import { test } from "node:test";
import assert from "node:assert/strict";
import { mapFires, distanceKm, firmsUrl, firmsConfigured } from "../src/firms.js";

// Fixture con el formato CSV real de FIRMS (área/VIIRS).
const CSV = [
  "latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,confidence,version,bright_ti5,frp,daynight",
  "-33.1400,-64.3600,330.1,0.4,0.36,2026-07-19,0412,N,nominal,2.0NRT,295.2,12.4,D",
  "-33.5000,-64.9000,310.0,0.5,0.40,2026-07-19,0413,N,low,2.0NRT,290.0,4.1,N",
  "bad,row,,,,,,,,,,,",
].join("\n");

test("mapFires parsea el CSV de FIRMS por nombre de columna", () => {
  const fires = mapFires(CSV);
  assert.equal(fires.length, 2); // la fila inválida se descarta
  assert.ok(Math.abs(fires[0].lat - -33.14) < 1e-6);
  assert.ok(Math.abs(fires[0].lng - -64.36) < 1e-6);
  assert.equal(fires[0].confidence, "nominal");
  assert.equal(fires[0].frp, 12.4);
  assert.equal(fires[0].acqDate, "2026-07-19");
});

test("mapFires tolera entradas vacías o inválidas", () => {
  assert.deepEqual(mapFires(""), []);
  assert.deepEqual(mapFires(null), []);
  assert.deepEqual(mapFires("solo,cabecera"), []);
});

test("distanceKm calcula distancias razonables", () => {
  const d = distanceKm(-33.13, -64.35, -33.14, -64.36);
  assert.ok(d >= 0 && d < 3); // ~1.4 km
});

test("distanceKm coincide con distancias conocidas (haversine)", () => {
  // Mismo punto -> 0.
  assert.equal(distanceKm(-33.13, -64.35, -33.13, -64.35), 0);
  // 1° de longitud en el ecuador ≈ 111.19 km.
  assert.ok(Math.abs(distanceKm(0, 0, 0, 1) - 111.19) < 1, `esperado ~111.19, dio ${distanceKm(0, 0, 0, 1)}`);
  // Buenos Aires -> Córdoba ≈ 646 km.
  const baCba = distanceKm(-34.61, -58.38, -31.42, -64.19);
  assert.ok(Math.abs(baCba - 646) < 15, `esperado ~646, dio ${baCba}`);
});

test("firmsConfigured refleja la presencia de FIRMS_MAP_KEY", () => {
  const prev = process.env.FIRMS_MAP_KEY;
  try {
    delete process.env.FIRMS_MAP_KEY;
    assert.equal(firmsConfigured(), false);
    process.env.FIRMS_MAP_KEY = "clave-demo";
    assert.equal(firmsConfigured(), true);
  } finally {
    if (prev === undefined) delete process.env.FIRMS_MAP_KEY;
    else process.env.FIRMS_MAP_KEY = prev;
  }
});

test("firmsUrl arma un bounding box alrededor del punto", () => {
  const url = firmsUrl(-33.13, -64.35, 2);
  assert.match(url, /firms\.modaps\.eosdis\.nasa\.gov\/api\/area\/csv/);
  assert.match(url, /-64\.8500,-33\.6300,-63\.8500,-32\.6300\/2$/);
});
