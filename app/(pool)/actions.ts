"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/supabase";
import { encodeSession, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth";

import { allowAuthAttempt } from "@/lib/auth-attempts";
import { isUuid, validateSessionConfiguration } from "@/lib/session";

// ─── Join Pool ────────────────────────────────────────────
// Returns { error: string } on failure, calls redirect() on success.
// We RETURN errors rather than throw so Next.js does not replace the message
// with the generic "Server Components render" text in production.
export async function joinPool(formData: FormData): Promise<{ error: string } | undefined> {
  const nameInput = formData.get("displayName"), codeInput = formData.get("passcode");
  const displayName = typeof nameInput === "string" ? nameInput.trim() : "";
  const passcode = typeof codeInput === "string" ? codeInput.trim().toUpperCase() : "";

  if (!displayName || displayName.length > 80 || !passcode || passcode.length > 128) {
    return { error: "Name and passcode are required." };
  }

  let supabase;
  try {
    validateSessionConfiguration();
    supabase = getAdminClient();
  } catch {
    return { error: "Server configuration error. Please contact the organiser." };
  }

  if (!(await allowAuthAttempt("join"))) return { error: "Please wait 15 minutes before trying again, or contact the organiser." };

  // Verify passcode
  const { data: pool, error: poolErr } = await supabase
    .from("pools")
    .select("id, name, passcode")
    .eq("passcode", passcode)
    .single();

  if (poolErr || !pool) {
    return { error: "Invalid passcode. Check with your organiser." };
  }

  // Insert new participant (never upsert — avoids silent account hijacking)
  const { data: participant, error: pErr } = await supabase
    .from("participants")
    .insert({ pool_id: pool.id, display_name: displayName })
    .select()
    .single();

  if (pErr || !participant) {
    return { error: pErr?.code === "23505" ? "That name is reserved. If it is yours, ask the organiser for a recovery code." : "Could not create participant. Please try again." };
  }

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_NAME,
    encodeSession({
      participantId: participant.id,
      poolId: pool.id,
      sessionVersion: participant.session_version,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
      secure: process.env.NODE_ENV === "production",
    }
  );

  redirect("/bracket");
}

// ─── Save Pick ────────────────────────────────────────────
export async function lockPick(formData: FormData) {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  const seriesId = formData.get("series_id");
  const pickedTeamId = formData.get("picked_team_id");
  const raw = formData.get("games_prediction");
  const gamesPrediction = raw === null || raw === "" ? null : Number(raw);
  if (!isUuid(seriesId) || !isUuid(pickedTeamId)) throw new Error("Invalid pick data.");
  if (gamesPrediction !== null && (!Number.isInteger(gamesPrediction) || gamesPrediction < 4 || gamesPrediction > 7)) {
    throw new Error("games_prediction must be 4, 5, 6, or 7.");
  }
  // One transaction checks membership and locks pool/series rows before writing.
  // No fallback to direct upsert if the required migration is not installed.
  const { error } = await getAdminClient().rpc("save_pool_pick", {
    p_participant_id: session.participantId, p_pool_id: session.poolId,
    p_series_id: seriesId, p_team_id: pickedTeamId, p_games: gamesPrediction, p_session_version: session.sessionVersion,
  });
  if (error) throw new Error("Pick could not be saved. It may be locked; refresh and try again.");
}

// ─── Logout ─────────────────────────────────────────────────────
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/");
}
