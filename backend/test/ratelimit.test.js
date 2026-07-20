import { test } from "node:test";
import assert from "node:assert/strict";
import { rateLimit } from "../src/ratelimit.js";

function fakeRes() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(s) { this.statusCode = s; return this; },
    json(b) { this.body = b; return this; },
  };
}
function hit(mw, ip = "1.1.1.1") {
  const res = fakeRes();
  let nexted = false;
  mw({ ip, socket: {} }, res, () => { nexted = true; });
  return { nexted, res };
}

test("rateLimit permite hasta max y luego responde 429", () => {
  const mw = rateLimit({ windowMs: 60_000, max: 2 });
  assert.equal(hit(mw).nexted, true);
  assert.equal(hit(mw).nexted, true);
  const third = hit(mw);
  assert.equal(third.nexted, false);
  assert.equal(third.res.statusCode, 429);
  assert.match(third.res.body.error, /Demasiadas/);
});

test("rateLimit cuenta por IP de forma independiente", () => {
  const mw = rateLimit({ windowMs: 60_000, max: 1 });
  assert.equal(hit(mw, "1.1.1.1").nexted, true);
  assert.equal(hit(mw, "1.1.1.1").nexted, false); // misma IP, bloqueada
  assert.equal(hit(mw, "2.2.2.2").nexted, true);  // otra IP, su propio cupo
});

test("rateLimit expone cabeceras X-RateLimit-*", () => {
  const { res } = hit(rateLimit({ windowMs: 60_000, max: 5 }));
  assert.equal(res.headers["X-RateLimit-Limit"], 5);
  assert.equal(res.headers["X-RateLimit-Remaining"], 4);
});
