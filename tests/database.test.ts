import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const ids = Array.from({ length: 8 }, (_, i) => `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`);
test("database denies public access and enforces atomic pick authorization/locks", async () => {
  const db = new PGlite();
  try {
    await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;");
    // PGlite lacks uuid-ossp; substitute PostgreSQL's equivalent built-in UUID
    // generator. Tables, policies and the security function run unchanged.
    const schema = readFileSync("tests/fixtures/pre-security-schema.sql", "utf8").replace('create extension if not exists "uuid-ossp";', "").replaceAll("uuid_generate_v4()", "gen_random_uuid()");
    await db.exec(schema);
    await db.exec("GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;");
    await db.query("INSERT INTO pools (id,name,passcode) VALUES ($1,'Test pool','LOCAL-ONLY'),($2,'Other pool','LOCAL-OTHER')", [ids[0], ids[1]]);
    await db.query("INSERT INTO participants (id,pool_id,display_name) VALUES ($1,$2,'Test')", [ids[2], ids[0]]);
    await db.query("INSERT INTO teams (id,name,abbreviation,seed,conference) VALUES ($1,'A','A',1,'East'),($2,'B','B',2,'East'),($3,'C','C',3,'East')", [ids[3],ids[4],ids[5]]);
    await db.query("INSERT INTO series (id,round,conference,slot,team_a_id,team_b_id) VALUES ($1,1,'East',1,$2,$3)", [ids[6],ids[3],ids[4]]);
    const save = (pool = ids[0], team = ids[3], games: number | null = 5) => db.query("SELECT save_pool_pick($1,$2,$3,$4,$5)", [ids[2],pool,ids[6],team,games]);
    // Prove the baseline exposure using synthetic data and Supabase-style grants.
    await db.exec("SET ROLE anon");
    assert.equal((await db.query("SELECT passcode FROM pools")).rows.length, 2);
    await db.exec("UPDATE series SET locked=true; UPDATE series SET locked=false");
    await db.exec("RESET ROLE");
    await db.exec(readFileSync("supabase/migrations/20261010_security.sql", "utf8"));
    await db.exec(readFileSync("supabase/migrations/20261010_security.sql", "utf8"));
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`SET ROLE ${role}`);
      for (const table of ["pools", "participants", "picks"]) await assert.rejects(db.query(`SELECT * FROM ${table}`), /permission denied/);
      await assert.rejects(db.query("UPDATE series SET locked=false"), /permission denied/);
      await assert.rejects(db.query("INSERT INTO participants(pool_id,display_name) VALUES ($1,'Intruder')", [ids[0]]), /permission denied/);
      await assert.rejects(save(), /permission denied/);
      assert.equal((await db.query("SELECT * FROM teams")).rows.length, 3);
      await db.exec("RESET ROLE");
    }
    await db.exec("SET ROLE service_role");
    await save();
    await assert.rejects(save(ids[1]), /Participant unavailable/);
    await assert.rejects(save(ids[0],ids[5]), /Invalid team/);
    await assert.rejects(save(ids[0],ids[3],8), /Invalid games/);
    await db.exec("UPDATE pools SET picks_locked_at=now()");
    await assert.rejects(save(), /Pool unavailable or locked/);
    await db.exec("UPDATE pools SET picks_locked_at=null; UPDATE series SET locked=true");
    await assert.rejects(save(), /Series locked/);
    await db.exec("UPDATE series SET locked=false; UPDATE picks SET locked=true");
    await assert.rejects(save(), /Pick locked/);
    assert.equal((await db.query<{ locked: boolean }>("SELECT locked FROM picks")).rows[0].locked, true);
    await db.query("UPDATE series SET winner_id=$1",[ids[3]]);
    await assert.rejects(save(), /Series locked/);
  } finally { await db.close(); }
});
