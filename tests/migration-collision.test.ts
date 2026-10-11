import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("recovery migration rolls back entirely on historical normalized-name collisions", async () => {
  const db = new PGlite();
  try {
    await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;");
    const base = readFileSync("supabase/schema.sql", "utf8").split("-- Review and apply after 20261010_security.sql.")[0]
      .replace('create extension if not exists "uuid-ossp";', "").replaceAll("uuid_generate_v4()", "gen_random_uuid()");
    await db.exec(base);
    const pool="00000000-0000-4000-8000-000000000001";
    await db.query("INSERT INTO pools(id,name,passcode) VALUES ($1,'Synthetic','fixture-only')",[pool]);
    await db.query("INSERT INTO participants(pool_id,display_name) VALUES ($1,'Jordan'),($1,' jordan ')",[pool]);
    await assert.rejects(db.exec(readFileSync("supabase/migrations/20261011_account_recovery.sql","utf8")),/unique index|duplicate key/);
    await db.exec("ROLLBACK");
    assert.equal((await db.query("SELECT * FROM participants")).rows.length,2,"identities are not renamed, merged or removed");
    assert.equal((await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='participants' AND column_name='session_version'")).rows.length,0);
    assert.equal((await db.query<{name: string|null}>("SELECT to_regclass('public.auth_attempt_buckets') AS name")).rows[0].name,null);
  } finally { await db.close(); }
});
