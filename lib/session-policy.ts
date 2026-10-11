import { allowAuthAttempt } from "./auth-attempts";
import { decodeSession, matchesSecret, validAdminSession, type Session } from "./session";

export async function resolveSession(raw: string | undefined, memberExists: (session: Session) => Promise<boolean>): Promise<Session | null> {
  const session = raw ? decodeSession(raw) : null;
  if (!session) return null;
  try { return await memberExists(session) ? session : null; }
  catch { return null; }
}

export async function adminCredentialsAuthorized(req: Request, cookie: string, allowAttempt = allowAuthAttempt): Promise<boolean> {
  // Existing authenticated organizers stay usable even if anonymous guesses exhaust the budget.
  if (req.headers.get("origin") === new URL(req.url).origin && validAdminSession(cookie)) return true;
  const entered = req.headers.get("x-admin-secret");
  if (entered === null || !(await allowAttempt("admin-login"))) return false;
  return matchesSecret(entered, process.env.ADMIN_SECRET);
}
