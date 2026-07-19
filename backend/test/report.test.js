import { test } from "node:test";
import assert from "node:assert/strict";
import { renderReportToBuffer, clean } from "../src/report.js";

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

test("clean normaliza primas y comillas tipográficas a ASCII", () => {
  // Primas (′ ″) y comillas de cierre (’ ”) que Helvetica no incluye.
  assert.equal(clean("33°08′S 64°21″O"), "33°08'S 64°21\"O");
  assert.equal(clean("Río’s"), "Río's");
  assert.equal(clean("fin”"), 'fin"');
  // Valores vacíos -> guion largo (marcador de "sin dato").
  assert.equal(clean(null), "—");
  assert.equal(clean(undefined), "—");
});
