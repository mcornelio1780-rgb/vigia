import { test } from "node:test";
import assert from "node:assert/strict";
import { renderReportToBuffer, clean, buildReportPdf } from "../src/report.js";

// Documento PDFKit simulado: cualquier método es encadenable (devuelve el
// propio proxy) y registra cuántas veces se llamó. No dibuja nada real.
function makeFakeDoc(calls) {
  const proxy = new Proxy(
    {},
    {
      get(_t, prop) {
        return (..._args) => {
          calls[prop] = (calls[prop] || 0) + 1;
          return proxy;
        };
      },
    }
  );
  return proxy;
}

const SAMPLE = {
  lang: "es",
  generatedAt: "2026-07-19T10:00:00Z",
  farm: { label: "Río Cuarto, Córdoba", country: "Argentina", coord: "33°08′S 64°21′O", hectares: 480 },
  risks: { fire: 74, drought: 58, flood: 12, pest: 37, frost: 21, wind: 46 },
  zones: [
    { id: "A", crop: "Soja — R3", ndvi: 0.79, ha: 96, fire: 30, soil: 55 },
    { id: "F", crop: "Barbecho", ndvi: 0.19, ha: 80, fire: 91, soil: 22 },
  ],
};

test("renderReportToBuffer produce un PDF válido y no trivial", async () => {
  const buf = await renderReportToBuffer(SAMPLE);
  assert.ok(Buffer.isBuffer(buf));
  assert.equal(buf.subarray(0, 5).toString("latin1"), "%PDF-"); // cabecera PDF
  assert.ok(buf.length > 1000, `PDF demasiado pequeño: ${buf.length} bytes`);
  assert.equal(buf.subarray(-6).toString("latin1").trim(), "%%EOF"); // fin de archivo PDF
});

test("renderReportToBuffer tolera datos mínimos sin romperse", async () => {
  const buf = await renderReportToBuffer({ farm: {} });
  assert.equal(buf.subarray(0, 5).toString("latin1"), "%PDF-");
});

test("renderReportToBuffer funciona en inglés", async () => {
  const buf = await renderReportToBuffer({ ...SAMPLE, lang: "en" });
  assert.ok(buf.length > 1000);
});

test("buildReportPdf no lanza con un doc simulado (datos completos y mínimos)", () => {
  const calls = {};
  const doc = makeFakeDoc(calls);
  assert.doesNotThrow(() => buildReportPdf(doc, SAMPLE));
  assert.ok(calls.text > 0, "debería escribir texto en el documento");
  // Datos mínimos: solo un farm vacío, tampoco debe lanzar.
  assert.doesNotThrow(() => buildReportPdf(doc, { farm: {} }));
  // Y sin datos en absoluto (usa los valores por defecto internos).
  assert.doesNotThrow(() => buildReportPdf(doc));
});

test("clean normaliza primas y comillas tipográficas a ASCII", () => {
  // Primas (′ ″) y comillas de cierre (’ ”) que Helvetica no incluye.
  assert.equal(clean("33°08′S 64°21″O"), "33°08'S 64°21\"O");
  assert.equal(clean("Río’s"), "Río's");
  assert.equal(clean("fin”"), 'fin"');
  // Valores vacíos -> guion largo (marcador de "sin dato").
  assert.equal(clean(null), "—");
  assert.equal(clean(undefined), "—");
});
