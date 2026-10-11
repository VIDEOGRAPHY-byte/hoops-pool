import { cookies } from "next/headers";
import { resolveSession } from "./session-policy";
import { getAdminClient } from "./supabase";
export { encodeSession, SESSION_MAX_AGE } from "./session";
export type { Session } from "./session";
export const SESSION_COOKIE_NAME = "hp_session";

export async function getSession() {
  const raw = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  let displayName: string | undefined;
  const session = await resolveSession(raw, async (session) => {
    const { data, error } = await getAdminClient().from("participants").select("display_name")
      .eq("id", session.participantId).eq("pool_id", session.poolId).eq("session_version", session.sessionVersion).maybeSingle();
    displayName = data?.display_name;
    return !error && typeof displayName === "string";
  });
  return session && displayName !== undefined ? { ...session, displayName } : null;
}
