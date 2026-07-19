import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { startServer, stopServer, resetDb, api, json } from "./helpers.js";
import { hashPassword, verifyPassword } from "../src/passwords.js";

let base;

before(async () => {
  base = await startServer();
});
beforeEach(resetDb);
after(stopServer);

test("hashPassword/verifyPassword con scrypt", () => {
  const stored = hashPassword("secreta123");
  assert.match(stored, /^[0-9a-f]{32}:[0-9a-f]{128}$/);
  assert.equal(verifyPassword("secreta123", stored), true);
  assert.equal(verifyPassword("otra", stored), false);
  assert.equal(verifyPassword("x", "sin-formato"), false);
});

async function signup(email = "farmer@field.ar", password = "secreta123", name = "María") {
  return api(base, "/api/users/signup", json("POST", { email, password, name }));
}

test("POST /api/users/signup crea usuario y devuelve token", async () => {
  const { status, body } = await signup();
  assert.equal(status, 201);
  assert.equal(body.user.email, "farmer@field.ar");
  assert.ok(body.token);
  assert.ok(!("password_hash" in body.user)); // nunca se expone el hash
});

test("signup valida email, contraseña y duplicados", async () => {
  assert.equal((await signup("no-es-email")).status, 400);
  assert.equal((await signup("a@b.com", "123")).status, 400); // pw corta
  assert.equal((await signup()).status, 201);
  assert.equal((await signup()).status, 409); // email repetido
});

test("login rechaza credenciales incorrectas y acepta las correctas", async () => {
  await signup("tom@farm.au", "clave-larga");
  assert.equal((await api(base, "/api/users/login", json("POST", { email: "tom@farm.au", password: "mala" }))).status, 401);
  assert.equal((await api(base, "/api/users/login", json("POST", { email: "nadie@x.com", password: "clave-larga" }))).status, 401);
  const ok = await api(base, "/api/users/login", json("POST", { email: "tom@farm.au", password: "clave-larga" }));
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);
});

test("GET /api/users/me requiere sesión y devuelve usuario + campos", async () => {
  const s = await signup();
  const auth = { Authorization: `Bearer ${s.body.token}` };

  assert.equal((await api(base, "/api/users/me")).status, 401);

  const me = await api(base, "/api/users/me", { headers: auth });
  assert.equal(me.status, 200);
  assert.equal(me.body.user.email, "farmer@field.ar");
  assert.deepEqual(me.body.farms, []);
});

test("un usuario crea y lista sus campos (persistidos con geografía)", async () => {
  const s = await signup();
  const auth = { Authorization: `Bearer ${s.body.token}`, "Content-Type": "application/json" };

  const created = await api(base, "/api/users/farms", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ name: "Lote Norte", hectares: 480, lat: -33.13, lng: -64.35 }),
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.name, "Lote Norte");
  assert.equal(created.body.hectares, 480);
  assert.ok(Math.abs(created.body.lat - -33.13) < 1e-6);

  const list = await api(base, "/api/users/farms", { headers: { Authorization: `Bearer ${s.body.token}` } });
  assert.equal(list.body.length, 1);

  const me = await api(base, "/api/users/me", { headers: { Authorization: `Bearer ${s.body.token}` } });
  assert.equal(me.body.farms.length, 1);
  assert.equal(me.body.farms[0].name, "Lote Norte");
});

test("crear campo sin nombre devuelve 400; sin sesión 401", async () => {
  const s = await signup();
  const auth = { Authorization: `Bearer ${s.body.token}`, "Content-Type": "application/json" };
  assert.equal((await api(base, "/api/users/farms", { method: "POST", headers: auth, body: JSON.stringify({ hectares: 10 }) })).status, 400);
  assert.equal((await api(base, "/api/users/farms", json("POST", { name: "X" }))).status, 401);
});

test("GET/PUT /api/users/settings guarda y carga preferencias", async () => {
  const s = await signup();
  const auth = { Authorization: `Bearer ${s.body.token}`, "Content-Type": "application/json" };

  assert.equal((await api(base, "/api/users/settings")).status, 401);

  // Nuevo usuario -> valores por defecto
  const def = await api(base, "/api/users/settings", { headers: { Authorization: `Bearer ${s.body.token}` } });
  assert.equal(def.status, 200);
  assert.equal(def.body.thFire, 60);
  assert.equal(def.body.wa, true);

  // Guarda cambios (con saneo: thFire fuera de rango se recorta, clave desconocida se ignora)
  const put = await api(base, "/api/users/settings", {
    method: "PUT",
    headers: auth,
    body: JSON.stringify({ settings: { thFire: 999, wa: false, daily: false, hacker: "x" } }),
  });
  assert.equal(put.status, 200);
  assert.equal(put.body.thFire, 95); // recortado al máximo
  assert.equal(put.body.wa, false);
  assert.equal(put.body.daily, false);
  assert.ok(!("hacker" in put.body));

  // Persistió y fusiona (thFlood sigue en su default)
  const after = await api(base, "/api/users/settings", { headers: { Authorization: `Bearer ${s.body.token}` } });
  assert.equal(after.body.thFire, 95);
  assert.equal(after.body.wa, false);
  assert.equal(after.body.thFlood, 50);
});

test("los campos de un usuario no son visibles para otro", async () => {
  const a = await signup("a@x.com", "clave-larga");
  const b = await signup("b@x.com", "clave-larga");
  await api(base, "/api/users/farms", {
    method: "POST",
    headers: { Authorization: `Bearer ${a.body.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "De A" }),
  });
  const listB = await api(base, "/api/users/farms", { headers: { Authorization: `Bearer ${b.body.token}` } });
  assert.equal(listB.body.length, 0);
});
