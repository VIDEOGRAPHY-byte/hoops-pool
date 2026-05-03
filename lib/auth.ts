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
    // Try new HMAC-signed format first: base64url(payload).base64url(sig)
    const dotIdx = raw.lastIndexOf(".");
    if (dotIdx !== -1) {
      const payload = raw.slice(0, dotIdx);
      const sig = raw.slice(dotIdx + 1);
      const expected = createHmac("sha256", getSecret()).update(payload).digest("base64url");
      if (timingSafeEqual(sig, expected)) {
        return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as Session;
      }
    }
    // Fall back to old bare base64 format so existing sessions keep working.
    // These will naturally be replaced with signed cookies on next login.
    return JSON.parse(Buffer.from(raw, "base64").toString("utf-8")) as Session;
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
