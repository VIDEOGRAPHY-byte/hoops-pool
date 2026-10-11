import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { encodeSession, decodeSession, encodeAdminSession, validAdminSession, SESSION_MAX_AGE } from "../lib/session";
import { isCronAuthorized } from "../lib/cronAuth";
process.env.SESSION_SECRET = "test-session-secret-with-at-least-32-characters";
process.env.ADMIN_SECRET = "test-admin-secret-with-at-least-32-characters";
const session = { participantId: "00000000-0000-4000-8000-000000000001", poolId: "00000000-0000-4000-8000-000000000002", sessionVersion: 0 };
const now = 1800000000;
test("signed session roundtrip and exact expiration", () => {
  const token = encodeSession(session, now);
  assert.deepEqual(decodeSession(token, now), session);
  assert.deepEqual(decodeSession(token, now + SESSION_MAX_AGE - 1), session);
  assert.equal(decodeSession(token, now + SESSION_MAX_AGE), null);
});
test("unsigned legacy, forged signature, malformed and oversized cookies fail closed", () => {
  const unsigned = Buffer.from(JSON.stringify(session)).toString("base64");
  for (const token of [unsigned, `${unsigned}.invalid`, "a.b.c", "x".repeat(3000), encodeSession(session, now).replace(/.$/, "!")]) {
    assert.equal(decodeSession(token, now), null);
  }
});
test("signed claims still require valid identity and purpose", () => {
  for (const patch of [{ sessionVersion: -1 }, { sessionVersion: undefined }, { participantId: "other" }, { exp: now - 1 }, { purpose: "admin" }, { exp: now + SESSION_MAX_AGE + 1 }]) {
    const payload = Buffer.from(JSON.stringify({ ...session, purpose: "participant", exp: now + 20, ...patch })).toString("base64url");
    const sig = createHmac("sha256", process.env.SESSION_SECRET!).update(payload).digest("base64url");
    assert.equal(decodeSession(`${payload}.${sig}`, now), null);
  }
});
test("admin sessions expire and never contain or accept the raw credential", () => {
  const token = encodeAdminSession(now);
  assert.equal(validAdminSession(token, now), true);
  assert.equal(validAdminSession(token, now + 8 * 3600), false);
  assert.equal(validAdminSession(process.env.ADMIN_SECRET!, now), false);
  assert.equal(validAdminSession(encodeSession(session, now), now), false);
  assert.equal(decodeSession(token, now), null);
  assert.equal(token.includes(process.env.ADMIN_SECRET!), false);
});
test("missing signing secret fails closed in every environment", () => {
  const token = encodeSession(session, now), old = process.env.SESSION_SECRET;
  delete process.env.SESSION_SECRET;
  assert.equal(decodeSession(token, now), null);
  assert.throws(() => encodeSession(session, now));
  process.env.SESSION_SECRET = old;
});
test("cron refuses missing and empty configuration, including Bearer undefined", () => {
  delete process.env.CRON_SECRET;
  const request = (value: string) => new Request("http://localhost/api/cron/odds", { headers: { authorization: value } });
  assert.equal(isCronAuthorized(request("Bearer undefined")), false);
  process.env.CRON_SECRET = "";
  assert.equal(isCronAuthorized(request("Bearer ")), false);
  process.env.CRON_SECRET = "local-test-cron";
  assert.equal(isCronAuthorized(request("Bearer local-test-cron")), true);
  assert.equal(isCronAuthorized(request("Bearer wrong")), false);
});

test("session requires current membership and fails closed on lookup failure", async () => {
  const { resolveSession } = await import("../lib/session-policy");
  const token = encodeSession(session);
  assert.deepEqual(await resolveSession(token, async (claims) => {
    assert.deepEqual(claims, session); return true;
  }), session);
  assert.equal(await resolveSession(token, async () => false), null);
  assert.equal(await resolveSession(token, async () => { throw new Error("database unavailable"); }), null);
  let lookedUp = false;
  assert.equal(await resolveSession("unsigned", async () => { lookedUp = true; return true; }), null);
  assert.equal(lookedUp, false);
});
test("admin cookie requires exact origin; API credentials use the login throttle", async () => {
  const { adminCredentialsAuthorized } = await import("../lib/session-policy");
  const token = encodeAdminSession();
  const req = (headers: Record<string, string>) => new Request("https://pool.example/api/admin/lock-series", { method: "POST", headers });
  assert.equal(await adminCredentialsAuthorized(req({ origin: "https://pool.example" }), token), true);
  for (const origin of ["https://attacker.example", "https://pool.example.attacker.example", "null"]) {
    assert.equal(await adminCredentialsAuthorized(req({ origin }), token), false);
  }
  assert.equal(await adminCredentialsAuthorized(req({}), token), false);
  assert.equal(await adminCredentialsAuthorized(req({ origin: "https://pool.example" }), process.env.ADMIN_SECRET!), false);
  assert.equal(await adminCredentialsAuthorized(req({ "x-admin-secret": process.env.ADMIN_SECRET! }), "", async () => true), true);
  assert.equal(await adminCredentialsAuthorized(req({ "x-admin-secret": "wrong" }), "", async () => true), false);
});


test("admin header attempts share a bounded login budget while valid cookies remain usable", async () => {
  const { adminCredentialsAuthorized } = await import("../lib/session-policy");
  let used = 4; // Four login form attempts already committed to the same durable scope.
  const allow = async (scope: string) => { assert.equal(scope, "admin-login"); return ++used <= 5; };
  const req = (secret: string, origin?: string) => new Request("https://pool.example/api/admin/recovery", {
    method: "POST", headers: { "x-admin-secret": secret, ...(origin ? { origin } : {}) },
  });
  assert.equal(await adminCredentialsAuthorized(req("wrong"), "", allow), false);
  assert.equal(await adminCredentialsAuthorized(req(process.env.ADMIN_SECRET!), "", allow), false);
  assert.equal(used, 6);
  assert.equal(await adminCredentialsAuthorized(req("wrong", "https://pool.example"), encodeAdminSession(), allow), true);
  assert.equal(used, 6, "authenticated cookies do not consume the failed-guess budget");
  assert.equal(await adminCredentialsAuthorized(req(process.env.ADMIN_SECRET!), "", async () => false), false);
});
