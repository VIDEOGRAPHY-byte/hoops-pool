import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { newRecoveryCode, recoveryDigest } from "../lib/recovery";
import { encodeSession, decodeSession } from "../lib/session";
import { allowAuthAttempt } from "../lib/auth-attempts";

test("recovery codes are random fixed-size secrets; malformed input is rejected", () => {
  const a = newRecoveryCode(), b = newRecoveryCode();
  assert.match(a, /^[A-Za-z0-9_-]{43}$/); assert.notEqual(a, b);
  assert.match(recoveryDigest(a)!, /^[a-f0-9]{64}$/);
  assert.notEqual(recoveryDigest(a), recoveryDigest(b));
  for (const bad of [null, 123, "", "x".repeat(100000), "a".repeat(42), "a".repeat(42) + "/"]) assert.equal(recoveryDigest(bad), null);
});

test("authentication throttle fails closed on missing, malformed or failed RPC responses", async () => {
  for (const data of [null, false, "true", [], {}]) {
    assert.equal(await allowAuthAttempt("join", async () => ({ data, error: null })), false);
  }
  assert.equal(await allowAuthAttempt("join", async () => ({ data: true, error: new Error("failed") })), false);
  assert.equal(await allowAuthAttempt("join", async () => { throw new Error("offline"); }), false);
  assert.equal(await allowAuthAttempt("join", async (scope) => { assert.equal(scope, "join"); return { data: true, error: null }; }), true);
});

test("recovery preserves picks, consumes once, revokes old versions; throttles are durable and bounded", async () => {
  const db = new PGlite();
  try {
    await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;");
    const schema = readFileSync("supabase/schema.sql", "utf8").replace('create extension if not exists "uuid-ossp";', "").replaceAll("uuid_generate_v4()", "gen_random_uuid()");
    await db.exec(schema);
    const pool = "00000000-0000-4000-8000-000000000001", member = "00000000-0000-4000-8000-000000000002";
    const otherPool = "00000000-0000-4000-8000-000000000003", team = "00000000-0000-4000-8000-000000000004", series = "00000000-0000-4000-8000-000000000005";
    await db.query("INSERT INTO pools(id,name,passcode) VALUES ($1,'Synthetic','Fixture A'),($2,'Other','Fixture B')",[pool,otherPool]);
    await db.query("INSERT INTO participants(id,pool_id,display_name) VALUES ($1,$2,'Jordan')",[member,pool]);
    await assert.rejects(db.query("INSERT INTO participants(pool_id,display_name) VALUES ($1,' jordan ')",[pool]), /unique/);
    await db.query("INSERT INTO participants(pool_id,display_name) VALUES ($1,'Jordan')",[otherPool]);
    await db.query("INSERT INTO teams(id,name,abbreviation,seed,conference) VALUES ($1,'A','A',1,'East')",[team]);
    await db.query("INSERT INTO series(id,round,conference,slot,team_a_id) VALUES ($1,1,'East',1,$2)",[series,team]);
    const digest = (c: string) => recoveryDigest(c)!;
    const code1 = digest(newRecoveryCode()), code2 = digest(newRecoveryCode());
    const issue = (hash: string, selectedPool = pool) => db.query("SELECT issue_participant_recovery($1,$2,$3)",[member,selectedPool,hash]);
    const redeem = (hash: string) => db.query<{ session_version: number }>("SELECT * FROM redeem_participant_recovery($1)",[hash]);
    const save = (version: number) => db.query("SELECT save_pool_pick($1,$2,$3,$4,5,$5)",[member,pool,series,team,version]);
    for (const role of ["anon","authenticated"]) {
      await db.exec(`SET ROLE ${role}`);
      await assert.rejects(issue(code1), /permission denied/);
      await assert.rejects(redeem(code1), /permission denied/);
      await assert.rejects(db.query("SELECT consume_auth_attempt('join')"), /permission denied/);
      await db.exec("RESET ROLE");
    }
    await db.exec("SET ROLE service_role");
    await save(0);
    await assert.rejects(db.query("SELECT save_pool_pick($1,$2,$3,$4,5)",[member,pool,series,team]), /does not exist/);
    await assert.rejects(issue(code1,otherPool), /Participant unavailable/);
    const legacyName = "Legacy " + "x".repeat(3000);
    await db.query("UPDATE participants SET display_name=$1 WHERE id=$2",[legacyName,member]);
    await issue(code1); await issue(code2);
    assert.equal((await redeem(code1)).rows.length, 0, "reissue invalidates the prior code");
    assert.equal((await redeem(digest(newRecoveryCode()))).rows.length, 0);
    const outcomes = await Promise.all([redeem(code2),redeem(code2)]);
    assert.equal(outcomes.reduce((n,x)=>n+x.rows.length,0),1,"only one redemption succeeds");
    assert.equal(outcomes.flatMap(x=>x.rows)[0].session_version,1);
    process.env.SESSION_SECRET = "synthetic-recovery-signing-key-at-least-32";
    const claims = { participantId: member, poolId: pool, sessionVersion: 1 };
    const cookie = encodeSession(claims);
    assert.deepEqual(decodeSession(cookie),claims,"legacy names do not limit identity cookies");
    assert.ok(cookie.length < 500);
    assert.equal((await db.query<{ display_name: string }>("SELECT display_name FROM participants WHERE id=$1",[member])).rows[0].display_name,legacyName);
    await assert.rejects(save(0), /Participant unavailable/);
    await save(1);
    assert.equal((await db.query("SELECT * FROM picks")).rows.length,1,"original picks remain intact");
    await issue(code1);
    await db.exec("UPDATE participant_recovery SET expires_at=clock_timestamp()-interval '1 second'");
    assert.equal((await redeem(code1)).rows.length,0);
    const attempts = await Promise.all(Array.from({length:12},()=>db.query<{ allowed: boolean }>("SELECT consume_auth_attempt('admin-login') AS allowed")));
    assert.equal(attempts.filter(x=>x.rows[0].allowed).length,5);
    assert.equal((await db.query<{ attempts: number }>("SELECT attempts FROM auth_attempt_buckets WHERE scope='admin-login'")).rows[0].attempts,6,"counter saturates");
    await db.exec("UPDATE auth_attempt_buckets SET window_started=clock_timestamp()-interval '16 minutes'");
    assert.equal((await db.query<{ allowed: boolean }>("SELECT consume_auth_attempt('admin-login') AS allowed")).rows[0].allowed,true);
    await assert.rejects(db.query("SELECT consume_auth_attempt('attacker-generated-bucket')"), /Invalid scope/);
    assert.equal((await db.query("SELECT * FROM auth_attempt_buckets")).rows.length,1,"no arbitrary bucket growth");
  } finally { await db.close(); }
});
