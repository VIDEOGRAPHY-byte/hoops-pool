import { cookies } from "next/headers";
import { createHmac } from "crypto";

const SESSION_COOKIE = "hp_session";

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET env var is required in production");
  }
  return s ?? "dev-only-insecure-secret-set-SESSION_SECRET-in-prod";
}

export interface Session {
  participantId: string;
  displayName: string;
  poolId: string;
}

/**
 * Encode a session as a signed token: base64url(payload).base64url(hmac)
 */
export function encodeSession(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    // Require HMAC-signed format: base64url(payload).base64url(sig)
    // Unsigned bare-base64 sessions are no longer accepted (session forgery risk).
    const dotIdx = raw.lastIndexOf(".");
    if (dotIdx === -1) return null; // reject unsigned cookies
    const payload = raw.slice(0, dotIdx);
    const sig = raw.slice(dotIdx + 1);
    const expected = createHmac("sha256", getSecret()).update(payload).digest("base64url");
    if (!timingSafeEqual(sig, expected)) return null; // reject tampered cookies
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as Session;
  } catch {
    return null;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
