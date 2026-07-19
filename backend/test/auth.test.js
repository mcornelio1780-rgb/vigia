import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

// Fija el secreto antes de importar auth.js (lee AUTH_SECRET al cargar).
process.env.AUTH_SECRET = "test-secret-auth";
const { issueToken, verifyToken, requireAdmin, requireUser } = await import("../src/auth.js");

// Simula el trío (req, res, next) de Express para probar los middlewares.
function fakeReqRes(headers = {}) {
  const res = {
    statusCode: 200,
    body: undefined,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
  const state = { nextCalled: false };
  const next = () => { state.nextCalled = true; };
  return { req: { headers }, res, next, state };
}
const bearer = (token) => ({ authorization: `Bearer ${token}` });

const nowSec = () => Math.floor(Date.now() / 1000);
const signBody = (body) =>
  crypto.createHmac("sha256", process.env.AUTH_SECRET).update(body).digest("base64url");
const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");

test("un token válido se verifica y devuelve el payload (role, sub, exp)", () => {
  const { token, expires_at } = issueToken({ role: "user", sub: "abc-123" });
  const payload = verifyToken(token);
  assert.ok(payload);
  assert.equal(payload.role, "user");
  assert.equal(payload.sub, "abc-123");
  assert.equal(payload.exp, expires_at);
  assert.ok(payload.exp > nowSec());
});

test("issueToken acepta un rol como string", () => {
  const { token } = issueToken("admin");
  assert.equal(verifyToken(token).role, "admin");
});

test("verifyToken rechaza firmas alteradas y tokens mal formados", () => {
  const { token } = issueToken({ role: "admin" });
  const [body, mac] = token.split(".");
  // Firma alterada (mismo largo, distinto contenido).
  const badMac = mac.slice(0, -1) + (mac.at(-1) === "A" ? "B" : "A");
  assert.equal(verifyToken(`${body}.${badMac}`), null);
  // Cuerpo alterado conservando la firma vieja.
  const otherBody = b64({ role: "admin", exp: nowSec() + 999 });
  assert.equal(verifyToken(`${otherBody}.${mac}`), null);
  // Formatos inválidos.
  assert.equal(verifyToken("sin-punto"), null);
  assert.equal(verifyToken(null), null);
  assert.equal(verifyToken(""), null);
});

test("verifyToken rechaza un token expirado aunque la firma sea válida", () => {
  const body = b64({ role: "admin", exp: nowSec() - 10 }); // exp en el pasado
  const token = `${body}.${signBody(body)}`;
  assert.equal(verifyToken(token), null);
});

test("verifyToken rechaza un token firmado con otro secreto", () => {
  const body = b64({ role: "admin", exp: nowSec() + 999 });
  const mac = crypto.createHmac("sha256", "otro-secreto").update(body).digest("base64url");
  assert.equal(verifyToken(`${body}.${mac}`), null);
});

test("requireAdmin exige un token de administrador válido", () => {
  // Sin cabecera Authorization -> 401.
  let x = fakeReqRes();
  requireAdmin(x.req, x.res, x.next);
  assert.equal(x.res.statusCode, 401);
  assert.equal(x.state.nextCalled, false);

  // Token de usuario (rol equivocado) -> 401.
  const userToken = issueToken({ role: "user", sub: "u1" }).token;
  x = fakeReqRes(bearer(userToken));
  requireAdmin(x.req, x.res, x.next);
  assert.equal(x.res.statusCode, 401);
  assert.equal(x.state.nextCalled, false);

  // Token de administrador válido -> next() y req.user con rol admin.
  const adminToken = issueToken("admin").token;
  x = fakeReqRes(bearer(adminToken));
  requireAdmin(x.req, x.res, x.next);
  assert.equal(x.state.nextCalled, true);
  assert.equal(x.req.user.role, "admin");
});

test("requireUser exige un token de usuario con id", () => {
  // Sin token -> 401.
  let x = fakeReqRes();
  requireUser(x.req, x.res, x.next);
  assert.equal(x.res.statusCode, 401);
  assert.equal(x.state.nextCalled, false);

  // Token de administrador (sin rol user/sub) -> 401.
  x = fakeReqRes(bearer(issueToken("admin").token));
  requireUser(x.req, x.res, x.next);
  assert.equal(x.res.statusCode, 401);
  assert.equal(x.state.nextCalled, false);

  // Token de usuario válido -> next() y req.user = { id: sub }.
  x = fakeReqRes(bearer(issueToken({ role: "user", sub: "u1" }).token));
  requireUser(x.req, x.res, x.next);
  assert.equal(x.state.nextCalled, true);
  assert.deepEqual(x.req.user, { id: "u1" });
});
