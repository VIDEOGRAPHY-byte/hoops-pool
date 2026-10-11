import { decodeSession, matchesSecret, validAdminSession, type Session } from "./session";

export async function resolveSession(raw: string | undefined, memberExists: (session: Session) => Promise<boolean>): Promise<Session | null> {
  const session = raw ? decodeSession(raw) : null;
  if (!session) return null;
  try { return await memberExists(session) ? session : null; }
  catch { return null; }
}

export function adminCredentialsAuthorized(req: Request, cookie: string): boolean {
  if (matchesSecret(req.headers.get("x-admin-secret"), process.env.ADMIN_SECRET)) return true;
  if (req.headers.get("origin") !== new URL(req.url).origin) return false;
  return validAdminSession(cookie);
}
