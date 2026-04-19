import { cookies } from "next/headers";

const SESSION_COOKIE = "hp_session";

export interface Session {
  participantId: string;
  displayName: string;
  poolId: string;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf-8")) as Session;
  } catch {
    return null;
  }
}

export function encodeSession(session: Session): string {
  return Buffer.from(JSON.stringify(session)).toString("base64");
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
