import { allowAuthAttempt } from "./auth-attempts";
import { newRecoveryCode, recoveryDigest } from "./recovery";
import { isUuid, validateSessionConfiguration, type Session } from "./session";
import { getAdminClient } from "./supabase";

type Rpc = (name: string, args: Record<string, string>) => Promise<{ data?: unknown; error: unknown }>;
const rpc: Rpc = async (name, args) => getAdminClient().rpc(name, args);
const reply = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function issueRecoveryResponse(req: Request, authorize: (req: Request) => Promise<boolean>,
  deps = { allow: allowAuthAttempt, rpc }) {
  try {
    if (!(await authorize(req))) return reply({ error: "Unauthorized" }, 401);
    let body;
    try { body = await req.json(); } catch { return reply({ error: "Invalid request" }, 400); }
    if (!body || !isUuid(body.participantId) || !isUuid(body.poolId) || body.identityVerified !== true) {
      return reply({ error: "Select the exact participant and verify their identity first." }, 400);
    }
    if (!(await deps.allow("recovery-issue"))) return reply({ error: "Please wait 15 minutes before issuing another code." }, 429);
    const code = newRecoveryCode();
    const { error } = await deps.rpc("issue_participant_recovery", {
      p_participant_id: body.participantId, p_pool_id: body.poolId, p_token_digest: recoveryDigest(code)!,
    });
    if (error) return reply({ error: "Recovery code could not be issued." }, 400);
    // Returned once to this authenticated request, never placed in URLs or logs.
    return reply({ code, expiresInMinutes: 30 });
  } catch { return reply({ error: "Recovery code could not be issued." }, 503); }
}

export async function redeemRecoveryIdentity(code: unknown, deps = { allow: allowAuthAttempt, rpc }): Promise<Session | null> {
  const digest = recoveryDigest(code);
  if (!digest) return null;
  try {
    // Check configuration before consuming the one-time token.
    validateSessionConfiguration();
    if (!(await deps.allow("recovery"))) return null;
    const { data, error } = await deps.rpc("redeem_participant_recovery", { p_token_digest: digest });
    const member = Array.isArray(data) ? data[0] : null;
    if (error || !member || !isUuid(member.participant_id) || !isUuid(member.pool_id) ||
        !Number.isSafeInteger(member.session_version) || member.session_version < 0) return null;
    return { participantId: member.participant_id, poolId: member.pool_id, sessionVersion: member.session_version };
  } catch { return null; }
}
