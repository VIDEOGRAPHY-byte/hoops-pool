/** Explicit pool setup only. Run with npm run seed after reviewing the target .env.local. */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "node:path";

dotenv.config({ path: resolve(process.cwd(), ".env.local"), quiet: true });
async function main() {
const passcode = process.env.POOL_PASSCODE?.trim().toUpperCase();
if (!passcode || passcode.length < 16 || passcode.length > 128) {
  throw new Error("Set an explicit POOL_PASSCODE of 16–128 characters before seeding.");
}
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const { error } = await client.from("pools").upsert({ name: "Hoops Pool 2026", passcode }, { onConflict: "passcode" });
if (error) throw new Error("Pool setup failed. Verify the target database and configuration.");
console.log("Pool setup completed. No credential values are logged.");
}
void main().catch(() => {
  console.error("Pool setup failed. Check the explicit passcode, credentials and target database before retrying.");
  process.exitCode = 1;
});
