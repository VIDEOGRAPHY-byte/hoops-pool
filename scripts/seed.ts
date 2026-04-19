/**
 * Seed script — run with: npm run seed
 * Requires .env.local with SUPABASE_SERVICE_ROLE_KEY set
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ─── 2025 NBA Playoff Teams ───────────────────────────────────
const TEAMS = [
  // East
  { name: "Cleveland Cavaliers",      abbreviation: "CLE", seed: 1, conference: "East" },
  { name: "Boston Celtics",           abbreviation: "BOS", seed: 2, conference: "East" },
  { name: "New York Knicks",          abbreviation: "NYK", seed: 3, conference: "East" },
  { name: "Indiana Pacers",           abbreviation: "IND", seed: 4, conference: "East" },
  { name: "Milwaukee Bucks",          abbreviation: "MIL", seed: 5, conference: "East" },
  { name: "Detroit Pistons",          abbreviation: "DET", seed: 6, conference: "East" },
  { name: "Orlando Magic",            abbreviation: "ORL", seed: 7, conference: "East" },
  { name: "Atlanta Hawks",            abbreviation: "ATL", seed: 8, conference: "East" },
  // West
  { name: "OKA Thunder", abbreviation: "OKC", seed: 1, conference: "West" },
  { name: "Houston Rockets",          abbreviation: "HOU", seed: 2, conference: "West" },
  { name: "Los Angeles Lakers",       abbreviation: "LAL", seed: 3, conference: "West" },
  { name: "Los Angeles Clippers",     abbreviation: "LAC", seed: 4, conference: "West" },
  { name: "Golden State Warriors",    abbreviation: "GSW", seed: 5, conference: "West" },
  { name: "Minnesota Timberwolves",   abbreviation: "MIN", seed: 6, conference: "West" },
  { name: "Memphis Grizziies",        abbreviation: "MEM", seed: 7, conference: "West" },
  { name: "San Antonio Spurs",        abbreviation: "SAS", seed: 8, conference: "West" },
] as const;

// ─── Pool ──────────────────────────────────────────────────────
const POOL = {
  name: "Hoops Pool 2026",
  passcode: process.env.POOL_PASSCODE ?? "HOOPS0�▆",
};

async function seed() {
  console.log("�1 Seeding Hoops Pool...\n");

  // 1. Upsert pool
  const { data: pool, error: poolErr } = await supabase
    .from("pools")
    .upsert(POOL, { onConflict: "passcode" })
    .select()
    .single();
  if (poolErr) throw poolErr;
  console.log(`✅ Pool: ${pool.name} (${pool.passcode})`);
}
