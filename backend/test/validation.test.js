import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidEmail, normalizeEmail, cleanName } from "../src/validation.js";

test("normalizeEmail recorta espacios y pasa a minúsculas", () => {
  assert.equal(normalizeEmail("  Farmer@Field.AR  "), "farmer@field.ar");
  assert.equal(normalizeEmail(null), "");
  assert.equal(normalizeEmail(undefined), "");
  assert.equal(normalizeEmail(123), "123");
});

test("isValidEmail acepta correos válidos (insensible a mayúsculas y espacios)", () => {
  for (const ok of [
    "a@b.com",
    "farmer@field.ar",
    "tom@farm.au",
    "reader@news.mx",
    "  Maria@Campo.AR  ",
    "user.name+tag@sub.example.com",
    "x@x.co",
  ]) {
    assert.equal(isValidEmail(ok), true, `debería ser válido: ${ok}`);
  }
});

test("isValidEmail rechaza correos inválidos", () => {
  for (const bad of [
    "",
    "   ",
    "no-es-email",
    "a@b",            // sin punto en el dominio
    "a@b.c",          // TLD de 1 letra
    "a@@b.com",       // dos @
    "a b@c.com",      // espacio
    "a@b..com",       // punto doble
    ".a@b.com",       // punto al inicio de la parte local
    "a.@b.com",       // punto al final de la parte local
    "a@.b.com",       // punto al inicio del dominio
    "a@b.com.",       // punto al final del dominio
    "a@b.c0m",        // TLD con dígitos
    "@b.com",         // sin parte local
    "a@",             // sin dominio
    null,
    undefined,
    {},
  ]) {
    assert.equal(isValidEmail(bad), false, `debería ser inválido: ${JSON.stringify(bad)}`);
  }
});

test("cleanName sanea y valida la longitud del nombre", () => {
  assert.deepEqual(cleanName("María"), { ok: true, value: "María" });
  assert.deepEqual(cleanName("  Ana Fernández  "), { ok: true, value: "Ana Fernández" });
  assert.deepEqual(cleanName(""), { ok: true, value: null });
  assert.deepEqual(cleanName("   "), { ok: true, value: null });
  assert.deepEqual(cleanName(null), { ok: true, value: null });
  assert.deepEqual(cleanName(undefined), { ok: true, value: null });
  assert.deepEqual(cleanName("z".repeat(120)), { ok: true, value: "z".repeat(120) });
  const tooLong = cleanName("z".repeat(121));
  assert.equal(tooLong.ok, false);
  assert.ok(tooLong.error);
});
