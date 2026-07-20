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
  assert.equal((await api(base, "/api/users/me", { headers: { Authorization: "Bearer basura" } })).status, 401); // token inválido

  const me = await api(base, "/api/users/me", { headers: auth });
  assert.equal(me.status, 200);
  assert.equal(me.body.user.email, "farmer@field.ar");
  assert.deepEqual(me.body.farms, []);
});

test("GET /api/users/stats resume campos, hectáreas y ubicación", async () => {
  const s = await signup("stats@field.ar", "clave-larga", "Estadística");
  const auth = { Authorization: `Bearer ${s.body.token}`, "Content-Type": "application/json" };

  // Sin sesión -> 401
  assert.equal((await api(base, "/api/users/stats")).status, 401);

  // Usuario nuevo -> todo en cero, con fecha de alta
  const empty = await api(base, "/api/users/stats", { headers: { Authorization: `Bearer ${s.body.token}` } });
  assert.equal(empty.status, 200);
  assert.deepEqual({ farms: empty.body.farms, hectares: empty.body.hectares, located: empty.body.located }, { farms: 0, hectares: 0, located: 0 });
  assert.ok(empty.body.memberSince);

  // Un campo con hectáreas y ubicación, otro solo con nombre
  await api(base, "/api/users/farms", { method: "POST", headers: auth, body: JSON.stringify({ name: "Con ubicación", hectares: 300, lat: -33.1, lng: -64.3 }) });
  await api(base, "/api/users/farms", { method: "POST", headers: auth, body: JSON.stringify({ name: "Sin nada más" }) });

  const stats = await api(base, "/api/users/stats", { headers: { Authorization: `Bearer ${s.body.token}` } });
  assert.equal(stats.body.farms, 2);
  assert.equal(stats.body.hectares, 300);
  assert.equal(stats.body.located, 1);
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

test("GET /api/users/farms/:id devuelve un campo propio y protege los ajenos", async () => {
  const a = await signup("g1@x.com", "clave-larga");
  const b = await signup("g2@x.com", "clave-larga");
  const authA = { Authorization: `Bearer ${a.body.token}`, "Content-Type": "application/json" };

  const created = await api(base, "/api/users/farms", {
    method: "POST",
    headers: authA,
    body: JSON.stringify({ name: "Lote Único", hectares: 210, lat: -33.13, lng: -64.35 }),
  });
  const id = created.body.id;

  // Sin sesión -> 401
  assert.equal((await api(base, `/api/users/farms/${id}`)).status, 401);

  // El dueño lo obtiene con sus coordenadas
  const own = await api(base, `/api/users/farms/${id}`, { headers: { Authorization: `Bearer ${a.body.token}` } });
  assert.equal(own.status, 200);
  assert.equal(own.body.name, "Lote Único");
  assert.ok(Math.abs(own.body.lat - -33.13) < 1e-6 && Math.abs(own.body.lng - -64.35) < 1e-6);

  // Otro usuario -> 404
  assert.equal((await api(base, `/api/users/farms/${id}`, { headers: { Authorization: `Bearer ${b.body.token}` } })).status, 404);

  // id con formato inválido -> 400
  assert.equal((await api(base, "/api/users/farms/no-uuid", { headers: { Authorization: `Bearer ${a.body.token}` } })).status, 400);
});

test("PUT /api/users/farms/:id edita un campo propio y valida propiedad", async () => {
  const a = await signup("fa@x.com", "clave-larga");
  const b = await signup("fb@x.com", "clave-larga");
  const authA = { Authorization: `Bearer ${a.body.token}`, "Content-Type": "application/json" };

  const created = await api(base, "/api/users/farms", {
    method: "POST",
    headers: authA,
    body: JSON.stringify({ name: "Lote Viejo", hectares: 100, lat: -33.1, lng: -64.3 }),
  });
  const id = created.body.id;

  // Sin sesión -> 401
  assert.equal((await api(base, `/api/users/farms/${id}`, json("PUT", { name: "X" }))).status, 401);

  // name obligatorio -> 400
  assert.equal((await api(base, `/api/users/farms/${id}`, { method: "PUT", headers: authA, body: JSON.stringify({ name: "  " }) })).status, 400);

  // hectares inválido -> 400
  assert.equal((await api(base, `/api/users/farms/${id}`, { method: "PUT", headers: authA, body: JSON.stringify({ name: "L", hectares: -3 }) })).status, 400);

  // coordenadas inválidas -> 400
  assert.equal((await api(base, `/api/users/farms/${id}`, { method: "PUT", headers: authA, body: JSON.stringify({ name: "L", lat: 999, lng: 0 }) })).status, 400);

  // id con formato inválido -> 400
  assert.equal((await api(base, "/api/users/farms/no-uuid", { method: "PUT", headers: authA, body: JSON.stringify({ name: "L" }) })).status, 400);

  // Editar solo el nombre preserva ubicación y hectáreas
  const upd = await api(base, `/api/users/farms/${id}`, { method: "PUT", headers: authA, body: JSON.stringify({ name: "Lote Nuevo" }) });
  assert.equal(upd.status, 200);
  assert.equal(upd.body.name, "Lote Nuevo");
  assert.equal(upd.body.hectares, 100); // preservado
  assert.ok(Math.abs(upd.body.lat - -33.1) < 1e-6); // preservada

  // Un usuario ajeno no puede editarlo -> 404
  const other = await api(base, `/api/users/farms/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${b.body.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Ajeno" }),
  });
  assert.equal(other.status, 404);
});

test("DELETE /api/users/farms/:id borra solo el campo propio", async () => {
  const a = await signup("owner@x.com", "clave-larga");
  const b = await signup("other@x.com", "clave-larga");
  const authA = { Authorization: `Bearer ${a.body.token}`, "Content-Type": "application/json" };
  const created = await api(base, "/api/users/farms", { method: "POST", headers: authA, body: JSON.stringify({ name: "Borrable" }) });
  const id = created.body.id;

  // Otro usuario no puede borrarlo
  const delOther = await api(base, `/api/users/farms/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${b.body.token}` } });
  assert.equal(delOther.status, 404);

  // El dueño sí
  const del = await api(base, `/api/users/farms/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${a.body.token}` } });
  assert.equal(del.status, 200);
  const list = await api(base, "/api/users/farms", { headers: { Authorization: `Bearer ${a.body.token}` } });
  assert.equal(list.body.length, 0);
});

test("PUT /api/users/me actualiza el nombre del perfil", async () => {
  const s = await signup("prof@field.ar", "clave-larga", "Nombre Viejo");
  const auth = { Authorization: `Bearer ${s.body.token}`, "Content-Type": "application/json" };

  // Sin sesión -> 401
  assert.equal((await api(base, "/api/users/me", json("PUT", { name: "X" }))).status, 401);

  // Nombre demasiado largo -> 400
  assert.equal(
    (await api(base, "/api/users/me", { method: "PUT", headers: auth, body: JSON.stringify({ name: "z".repeat(121) }) })).status,
    400
  );

  // Cambio correcto -> 200 y persiste
  const upd = await api(base, "/api/users/me", { method: "PUT", headers: auth, body: JSON.stringify({ name: "  Nombre Nuevo  " }) });
  assert.equal(upd.status, 200);
  assert.equal(upd.body.user.name, "Nombre Nuevo"); // se recorta el espacio
  assert.equal(upd.body.user.email, "prof@field.ar");

  const me = await api(base, "/api/users/me", { headers: { Authorization: `Bearer ${s.body.token}` } });
  assert.equal(me.body.user.name, "Nombre Nuevo");
});

test("DELETE /api/users/me elimina la cuenta y sus campos en cascada", async () => {
  const s = await signup("del@field.ar", "clave-larga", "Borrar");
  const auth = { Authorization: `Bearer ${s.body.token}` };

  // Sin sesión -> 401
  assert.equal((await api(base, "/api/users/me", { method: "DELETE" })).status, 401);

  // Crea un campo que debe borrarse en cascada
  await api(base, "/api/users/farms", {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Se va con la cuenta" }),
  });

  // Borra la cuenta
  const del = await api(base, "/api/users/me", { method: "DELETE", headers: auth });
  assert.equal(del.status, 200);
  assert.equal(del.body.ok, true);

  // El token deja de servir: el usuario ya no existe -> 404
  assert.equal((await api(base, "/api/users/me", { headers: auth })).status, 404);

  // El correo queda libre: puede volver a registrarse
  const again = await signup("del@field.ar", "otra-clave", "Nuevo");
  assert.equal(again.status, 201);
  // Y no arrastra el campo anterior (se borró en cascada)
  const me2 = await api(base, "/api/users/me", { headers: { Authorization: `Bearer ${again.body.token}` } });
  assert.deepEqual(me2.body.farms, []);
});

test("GET /api/users/export devuelve perfil, campos y preferencias", async () => {
  const s = await signup("exp@field.ar", "clave-larga", "Exportador");
  const auth = { Authorization: `Bearer ${s.body.token}` };

  // Sin sesión -> 401
  assert.equal((await api(base, "/api/users/export")).status, 401);

  // Con un campo y una preferencia guardada
  await api(base, "/api/users/farms", {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Lote Export", hectares: 120, lat: -34.6, lng: -58.4 }),
  });
  await api(base, "/api/users/settings", {
    method: "PUT",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ settings: { thFire: 80 } }),
  });

  const res = await fetch(`${base}/api/users/export`, { headers: auth });
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-disposition") || "", /vigia-datos\.json/);
  const body = await res.json();
  assert.equal(body.user.email, "exp@field.ar");
  assert.equal(body.user.name, "Exportador");
  assert.ok(!("password_hash" in body.user)); // nunca se exporta el hash
  assert.equal(body.farms.length, 1);
  assert.equal(body.farms[0].name, "Lote Export");
  assert.equal(body.settings.thFire, 80); // preferencia guardada
  assert.equal(body.settings.thFlood, 50); // fusionada con el default
  assert.ok(body.exportedAt);
});

test("PUT /api/users/password cambia la contraseña con la actual correcta", async () => {
  const s = await signup("chg@field.ar", "clave-vieja", "Ana");
  const auth = { Authorization: `Bearer ${s.body.token}`, "Content-Type": "application/json" };

  // Sin sesión -> 401
  assert.equal((await api(base, "/api/users/password", json("PUT", { current: "clave-vieja", next: "clave-nueva" }))).status, 401);

  // Nueva contraseña demasiado corta -> 400
  assert.equal(
    (await api(base, "/api/users/password", { method: "PUT", headers: auth, body: JSON.stringify({ current: "clave-vieja", next: "123" }) })).status,
    400
  );

  // Contraseña actual incorrecta -> 401
  assert.equal(
    (await api(base, "/api/users/password", { method: "PUT", headers: auth, body: JSON.stringify({ current: "no-es", next: "clave-nueva" }) })).status,
    401
  );

  // Cambio correcto -> 200
  const ok = await api(base, "/api/users/password", { method: "PUT", headers: auth, body: JSON.stringify({ current: "clave-vieja", next: "clave-nueva" }) });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.ok, true);

  // La contraseña vieja ya no sirve; la nueva sí
  assert.equal((await api(base, "/api/users/login", json("POST", { email: "chg@field.ar", password: "clave-vieja" }))).status, 401);
  assert.equal((await api(base, "/api/users/login", json("POST", { email: "chg@field.ar", password: "clave-nueva" }))).status, 200);
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
