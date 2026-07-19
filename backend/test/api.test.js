import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { startServer, stopServer, resetDb, api, json } from "./helpers.js";

let base;

before(async () => {
  base = await startServer();
});
beforeEach(resetDb);
after(stopServer);

async function adminToken() {
  const { body } = await api(base, "/api/auth/login", json("POST", { password: "test-admin" }));
  return body.token;
}

test("GET /api/health devuelve la versión de PostGIS", async () => {
  const { status, body } = await api(base, "/api/health");
  assert.equal(status, 200);
  assert.equal(body.status, "ok");
  assert.match(body.postgis, /^\d+\.\d+/);
});

test("POST /api/leads crea un lead de lista de espera con ubicación", async () => {
  const { status, body } = await api(
    base,
    "/api/leads",
    json("POST", { email: "farmer@field.ar", kind: "waitlist", country: "Argentina", hectares: 480, lat: -33.13, lng: -64.35 })
  );
  assert.equal(status, 201);
  assert.equal(body.email, "farmer@field.ar");
  assert.equal(body.kind, "waitlist");
  assert.equal(body.hectares, 480);
  assert.ok(Math.abs(body.lat - -33.13) < 1e-6 && Math.abs(body.lng - -64.35) < 1e-6);
});

test("POST /api/leads acepta el boletín sin ubicación", async () => {
  const { status, body } = await api(base, "/api/leads", json("POST", { email: "reader@news.mx", kind: "newsletter" }));
  assert.equal(status, 201);
  assert.equal(body.kind, "newsletter");
  assert.equal(body.lat, null);
});

test("POST /api/leads valida email, kind, hectares y coordenadas", async () => {
  assert.equal((await api(base, "/api/leads", json("POST", { email: "no-es-email" }))).status, 400);
  assert.equal((await api(base, "/api/leads", json("POST", { email: "a@b.com", kind: "otro" }))).status, 400);
  assert.equal((await api(base, "/api/leads", json("POST", { email: "a@b.com", hectares: -5 }))).status, 400);
  assert.equal((await api(base, "/api/leads", json("POST", { email: "a@b.com", lat: 999, lng: 0 }))).status, 400);
});

test("POST /api/leads es idempotente por (email, kind)", async () => {
  await api(base, "/api/leads", json("POST", { email: "dup@field.com", kind: "waitlist" }));
  await api(base, "/api/leads", json("POST", { email: "dup@field.com", kind: "waitlist", country: "Chile" }));
  const token = await adminToken();
  const { body } = await api(base, "/api/leads", { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(body.length, 1);
  assert.equal(body[0].country, "Chile"); // el segundo envío completó el país
});

test("GET /api/leads/stats devuelve conteos públicos", async () => {
  await api(base, "/api/leads", json("POST", { email: "a@x.com", kind: "waitlist", country: "USA" }));
  await api(base, "/api/leads", json("POST", { email: "b@x.com", kind: "waitlist", country: "Brasil" }));
  await api(base, "/api/leads", json("POST", { email: "c@x.com", kind: "newsletter" }));
  const { status, body } = await api(base, "/api/leads/stats");
  assert.equal(status, 200);
  assert.equal(body.waitlist, 2);
  assert.equal(body.newsletter, 1);
  assert.equal(body.total, 3);
  assert.equal(body.countries, 2);
});

test("GET /api/leads requiere administrador", async () => {
  const sinToken = await api(base, "/api/leads");
  assert.equal(sinToken.status, 401);

  await api(base, "/api/leads", json("POST", { email: "w@x.com", kind: "waitlist" }));
  await api(base, "/api/leads", json("POST", { email: "n@x.com", kind: "newsletter" }));
  const token = await adminToken();
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const all = await api(base, "/api/leads", auth);
  assert.equal(all.status, 200);
  assert.equal(all.body.length, 2);

  const onlyWaitlist = await api(base, "/api/leads?kind=waitlist", auth);
  assert.equal(onlyWaitlist.body.length, 1);
  assert.equal(onlyWaitlist.body[0].kind, "waitlist");

  const badKind = await api(base, "/api/leads?kind=otro", auth);
  assert.equal(badKind.status, 400);
});

test("POST /api/auth/login rechaza contraseña incorrecta y acepta la correcta", async () => {
  assert.equal((await api(base, "/api/auth/login", json("POST", { password: "mala" }))).status, 401);
  const ok = await api(base, "/api/auth/login", json("POST", { password: "test-admin" }));
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);
});

test("GET /api/auth/me valida el token de administrador", async () => {
  assert.equal((await api(base, "/api/auth/me")).status, 401);
  const token = await adminToken();
  const ok = await api(base, "/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.role, "admin");
});

test("POST /api/report devuelve un PDF de evidencia", async () => {
  const res = await fetch(`${base}/api/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lang: "es",
      farm: { label: "Río Cuarto", country: "Argentina", coord: "33°08′S 64°21′O", hectares: 480 },
      risks: { fire: 74, drought: 58 },
      zones: [{ id: "A", crop: "Soja", ndvi: 0.79, ha: 96, fire: 30, soil: 55 }],
    }),
  });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "application/pdf");
  const buf = Buffer.from(await res.arrayBuffer());
  assert.equal(buf.subarray(0, 5).toString("latin1"), "%PDF-");
  assert.ok(buf.length > 1000);
});

test("POST /api/report sin farm devuelve 400", async () => {
  const { status } = await api(base, "/api/report", json("POST", {}));
  assert.equal(status, 400);
});
