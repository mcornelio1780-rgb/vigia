import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeSettings, NUM_RANGES, BOOL_KEYS, SETTING_DEFAULTS } from "../src/routes/users.js";

test("sanitizeSettings recorta los numéricos a su rango", () => {
  assert.deepEqual(sanitizeSettings({ thFire: 999 }), { thFire: 95 }); // máx thFire
  assert.deepEqual(sanitizeSettings({ thFire: 0 }), { thFire: 20 }); // mín thFire
  assert.deepEqual(sanitizeSettings({ thFire: 60 }), { thFire: 60 });
  assert.deepEqual(sanitizeSettings({ thFlood: 5 }), { thFlood: 10 }); // mín thFlood
  assert.deepEqual(sanitizeSettings({ thFlood: 250 }), { thFlood: 200 }); // máx thFlood
});

test("sanitizeSettings redondea los numéricos y luego recorta", () => {
  assert.deepEqual(sanitizeSettings({ thFire: 60.4 }), { thFire: 60 });
  assert.deepEqual(sanitizeSettings({ thFire: 60.6 }), { thFire: 61 });
  assert.deepEqual(sanitizeSettings({ thWind: 10.2 }), { thWind: 20 }); // redondea a 10, recorta a 20
});

test("sanitizeSettings sólo acepta booleans reales", () => {
  assert.deepEqual(sanitizeSettings({ wa: true, sms: false }), { wa: true, sms: false });
  assert.deepEqual(sanitizeSettings({ wa: "true", sms: 1 }), {}); // strings/números ignorados
});

test("sanitizeSettings ignora claves desconocidas", () => {
  assert.deepEqual(sanitizeSettings({ hacker: "x", foo: 5, thFire: 70 }), { thFire: 70 });
});

test("sanitizeSettings con entrada no-objeto devuelve {}", () => {
  for (const bad of [null, undefined, "texto", 42, true]) {
    assert.deepEqual(sanitizeSettings(bad), {});
  }
});

test("los valores por defecto y rangos exportados son coherentes", () => {
  assert.equal(SETTING_DEFAULTS.thFire, 60);
  assert.deepEqual(NUM_RANGES.thFire, [20, 95]);
  assert.ok(BOOL_KEYS.includes("wa"));
});
