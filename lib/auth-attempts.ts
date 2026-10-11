import { getAdminClient } from "./supabase";

export type AuthScope = "join" | "admin-login" | "recovery" | "recovery-issue";

// An independent RPC commits before authentication. Fail closed if the migration
// or database is unavailable. Never trust arbitrary forwarded IP headers.
export async function allowAuthAttempt(scope: AuthScope, request = async (value: AuthScope): Promise<{ data: unknown; error: unknown }> =>
  getAdminClient().rpc("consume_auth_attempt", { p_scope: value })) : Promise<boolean> {
  try {
    const { data, error } = await request(scope);
    return !error && data === true;
  } catch { return false; }
}
