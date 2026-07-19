import { test } from "node:test";
import assert from "node:assert/strict";
import { mapForecast, forecastUrl, fetchForecast } from "../src/weather.js";

// Fixture con la forma real de la respuesta diaria de Open-Meteo.
const SAMPLE = {
  daily: {
    time: ["2026-07-20", "2026-07-21", "2026-07-22"], // lun, mar, mié
    temperature_2m_max: [28.4, 30.1, 26.9],
    temperature_2m_min: [14.2, 15.8, 13.1],
    precipitation_sum: [0, 3.6, 0.4],
    wind_speed_10m_max: [21.7, 33.2, 18.0],
  },
};

test("mapForecast mapea y redondea la respuesta de Open-Meteo", () => {
  const days = mapForecast(SAMPLE);
  assert.equal(days.length, 3);
  assert.deepEqual(days[0], { d: "L", de: "M", n: 0, tmax: 28, tmin: 14, p: 0, w: 22, h: 46 });
  assert.equal(days[1].tmax, 30);
  assert.equal(days[1].p, 4);
  assert.equal(days[1].h, 78); // con lluvia > 1 mm, humedad alta
  assert.equal(days[2].d, "X"); // miércoles en la convención del dashboard
});

test("mapForecast tolera respuestas vacías o inválidas", () => {
  assert.deepEqual(mapForecast({}), []);
  assert.deepEqual(mapForecast(null), []);
  assert.deepEqual(mapForecast({ daily: { time: null } }), []);
});

test("mapForecast tolera días con valores parciales o ausentes", () => {
  // Solo fechas, sin arrays de valores -> ceros, sin romperse. 2026-07-19 = domingo.
  const days = mapForecast({ daily: { time: ["2026-07-19", "2026-07-20"] } });
  assert.equal(days.length, 2);
  assert.deepEqual(days[0], { d: "D", de: "S", n: 0, tmax: 0, tmin: 0, p: 0, w: 0, h: 46 });

  // time más largo que los arrays de valores -> los faltantes caen a 0.
  const partial = mapForecast({
    daily: { time: ["2026-07-20", "2026-07-21"], temperature_2m_max: [28.4], precipitation_sum: [5] },
  });
  assert.equal(partial[0].tmax, 28);
  assert.equal(partial[0].p, 5);
  assert.equal(partial[0].h, 78); // p > 1 -> humedad alta
  assert.equal(partial[1].tmax, 0); // sin dato -> 0
  assert.equal(partial[1].p, 0);
  assert.equal(partial[1].h, 46);
});

test("forecastUrl arma la URL de Open-Meteo con las coordenadas", () => {
  const url = forecastUrl(-33.13, -64.35);
  assert.match(url, /^https:\/\/api\.open-meteo\.com\/v1\/forecast\?/);
  assert.match(url, /latitude=-33\.13/);
  assert.match(url, /longitude=-64\.35/);
  assert.match(url, /forecast_days=10/);
});

test("fetchForecast mapea la respuesta ok y lanza si el upstream falla", async (t) => {
  const realFetch = globalThis.fetch;
  try {
    // Respuesta correcta -> devuelve la serie mapeada.
    globalThis.fetch = async () => ({ ok: true, json: async () => SAMPLE });
    const days = await fetchForecast(-33, -64);
    assert.equal(days.length, 3);
    assert.equal(days[0].tmax, 28);

    // Upstream con error -> fetchForecast rechaza.
    globalThis.fetch = async () => ({ ok: false, status: 502 });
    await assert.rejects(() => fetchForecast(-33, -64));
  } finally {
    globalThis.fetch = realFetch;
  }
});
