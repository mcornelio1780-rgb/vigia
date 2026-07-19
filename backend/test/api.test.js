import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startServer, stopServer, resetDb, api, FIXTURES } from "./helpers.js";

let base;

before(async () => {
  base = await startServer();
  await resetDb();
});

after(stopServer);

test("GET /api/health devuelve la versión de PostGIS", async () => {
  const { status, body } = await api(base, "/api/health");
  assert.equal(status, 200);
  assert.equal(body.status, "ok");
  assert.match(body.postgis, /^\d+\.\d+/);
});

test("GET /api/categories devuelve el catálogo", async () => {
  const { status, body } = await api(base, "/api/categories");
  assert.equal(status, 200);
  assert.equal(body.length, 6);
  assert.ok(body.every((c) => c.slug && c.name && c.color));
});

test("GET /api/reports devuelve los tres reportes de prueba", async () => {
  const { status, body } = await api(base, "/api/reports");
  assert.equal(status, 200);
  assert.equal(body.length, 3);
  assert.ok("lat" in body[0] && "lng" in body[0] && "category" in body[0]);
});

test("filtro por categoría", async () => {
  const { body } = await api(base, "/api/reports?category=alumbrado");
  assert.equal(body.length, 1);
  assert.equal(body[0].title, FIXTURES.cerca.title);
});

test("filtro por estado", async () => {
  const { body } = await api(base, "/api/reports?status=resuelto");
  assert.equal(body.length, 1);
  assert.equal(body[0].title, FIXTURES.lejos.title);
});

test("filtro bbox excluye lo que queda fuera del rectángulo", async () => {
  const { body } = await api(base, "/api/reports?bbox=-99.14,19.42,-99.12,19.44");
  const titles = body.map((r) => r.title).sort();
  assert.deepEqual(titles, [FIXTURES.cerca.title, FIXTURES.medio.title].sort());
});

test("bbox inválido devuelve 400", async () => {
  const { status } = await api(base, "/api/reports?bbox=1,2,3");
  assert.equal(status, 400);
});

test("filtro near + radius usa ST_DWithin", async () => {
  const { body } = await api(base, "/api/reports?near=-99.1332,19.4326&radius=1000");
  const titles = body.map((r) => r.title).sort();
  assert.deepEqual(titles, [FIXTURES.cerca.title, FIXTURES.medio.title].sort());
});

test("radius inválido devuelve 400", async () => {
  const { status } = await api(base, "/api/reports?near=-99.13,19.43&radius=-5");
  assert.equal(status, 400);
});

test("GET /api/reports/geojson devuelve un FeatureCollection", async () => {
  const { status, body } = await api(base, "/api/reports/geojson");
  assert.equal(status, 200);
  assert.equal(body.type, "FeatureCollection");
  assert.equal(body.features.length, 3);
  assert.equal(body.features[0].geometry.type, "Point");
});

test("POST /api/reports valida entradas", async () => {
  const post = (payload) =>
    api(base, "/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

  assert.equal((await post({ category: "otro", lat: 19, lng: -99 })).status, 400); // sin título
  assert.equal((await post({ title: "x", lat: 19, lng: -99 })).status, 400); // sin categoría
  assert.equal((await post({ title: "x", category: "otro", lat: 999, lng: -99 })).status, 400); // coords
  assert.equal((await post({ title: "x", category: "no-existe", lat: 19, lng: -99 })).status, 400);
  assert.equal(
    (await post({ title: "x", category: "otro", lat: 19, lng: -99, photo_url: "http://malo/x.png" })).status,
    400
  ); // photo_url no permitido
});

test("POST /api/reports crea un reporte", async () => {
  const { status, body } = await api(base, "/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Nuevo", category: "otro", lat: 19.43, lng: -99.13, reporter_name: "Test" }),
  });
  assert.equal(status, 201);
  assert.equal(body.title, "Nuevo");
  assert.equal(body.status, "abierto");
  assert.equal(body.photo_url, null);
  assert.equal(body.category.slug, "otro");
});

test("GET /api/reports/:id maneja 404 e id inválido", async () => {
  const list = await api(base, "/api/reports");
  const id = list.body[0].id;
  assert.equal((await api(base, `/api/reports/${id}`)).status, 200);
  assert.equal((await api(base, "/api/reports/00000000-0000-0000-0000-000000000000")).status, 404);
  assert.equal((await api(base, "/api/reports/no-es-uuid")).status, 400);
});

test("POST /api/auth/login rechaza contraseña incorrecta y acepta la correcta", async () => {
  const bad = await api(base, "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "mala" }),
  });
  assert.equal(bad.status, 401);

  const ok = await api(base, "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "test-admin" }),
  });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);
});

test("PATCH status requiere administrador", async () => {
  const list = await api(base, "/api/reports");
  const id = list.body.find((r) => r.status !== "resuelto").id;

  // Sin token -> 401
  const sinToken = await api(base, `/api/reports/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "resuelto" }),
  });
  assert.equal(sinToken.status, 401);

  // Con token de admin -> 200 y cambia el estado
  const login = await api(base, "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "test-admin" }),
  });
  const auth = { Authorization: `Bearer ${login.body.token}`, "Content-Type": "application/json" };

  const malStatus = await api(base, `/api/reports/${id}/status`, {
    method: "PATCH",
    headers: auth,
    body: JSON.stringify({ status: "invalido" }),
  });
  assert.equal(malStatus.status, 400);

  const ok = await api(base, `/api/reports/${id}/status`, {
    method: "PATCH",
    headers: auth,
    body: JSON.stringify({ status: "resuelto" }),
  });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.status, "resuelto");
});

test("subida de imagen y creación de reporte con foto", async () => {
  // PNG 1x1 transparente
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64"
  );
  const form = new FormData();
  form.append("image", new Blob([png], { type: "image/png" }), "pin.png");

  const up = await api(base, "/api/uploads", { method: "POST", body: form });
  assert.equal(up.status, 201);
  assert.match(up.body.url, /^\/uploads\/.+\.png$/);

  const created = await api(base, "/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Con foto", category: "otro", lat: 19.43, lng: -99.13, photo_url: up.body.url }),
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.photo_url, up.body.url);

  // La imagen se sirve de forma estática
  const served = await fetch(`${base}${up.body.url}`);
  assert.equal(served.status, 200);
  assert.match(served.headers.get("content-type") || "", /image/);
});

test("POST /api/uploads sin archivo devuelve 400", async () => {
  const { status } = await api(base, "/api/uploads", { method: "POST", body: new FormData() });
  assert.equal(status, 400);
});
