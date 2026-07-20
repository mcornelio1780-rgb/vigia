import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../src/passwords.js";

test("hashPassword produce el formato salt:hash en hex", () => {
  assert.match(hashPassword("secreta123"), /^[0-9a-f]{32}:[0-9a-f]{128}$/);
});

test("dos hashes de la misma contraseña difieren (sal aleatoria) pero ambos verifican", () => {
  const a = hashPassword("misma-clave");
  const b = hashPassword("misma-clave");
  assert.notEqual(a, b); // sal distinta
  assert.equal(verifyPassword("misma-clave", a), true);
  assert.equal(verifyPassword("misma-clave", b), true);
});

test("verifyPassword rechaza contraseñas incorrectas y almacenamientos inválidos", () => {
  const stored = hashPassword("correcta");
  assert.equal(verifyPassword("incorrecta", stored), false);
  // Formatos de almacenamiento inválidos.
  assert.equal(verifyPassword("x", "sin-formato"), false); // sin ":"
  assert.equal(verifyPassword("x", ""), false);
  assert.equal(verifyPassword("x", null), false);
  assert.equal(verifyPassword("x", undefined), false);
  // Hash alterado (mismo largo y hex válido) -> no verifica.
  const tampered = stored.slice(0, -1) + (stored.at(-1) === "a" ? "b" : "a");
  assert.equal(verifyPassword("correcta", tampered), false);
});

test("verifyPassword funciona con unicode y espacios", () => {
  for (const pw of ["contraseña con espacios", "áéíóú-ñ-ü", "🔐clave-emoji"]) {
    const stored = hashPassword(pw);
    assert.equal(verifyPassword(pw, stored), true);
    assert.equal(verifyPassword(pw + "x", stored), false);
  }
});
