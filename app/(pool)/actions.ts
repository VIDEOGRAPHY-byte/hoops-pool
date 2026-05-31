"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/supabase";
import { encodeSession, SESSION_COOKIE_NAME } from "@/lib/auth";

// ─── Join Pool ────────────────────────────────────────────
// Returns { error: string } on failure, calls redirect() on success.
// We RETURN errors rather than throw so Next.js does not replace the message
// with the generic "Server Components render" text in production.
export async function joinPool(formData: FormData): Promise<{ error: string } | undefined> {
  const displayName = (formData.get("displayName") as string)?.trim();
  const passcode = (formData.get("passcode") as string)?.trim().toUpperCase();

  if (!displayName || !passcode) {
    return { error: "Name and passcode are required." };
  }

  let supabase;
  try {
    supabase = getAdminClient();
  } catch {
    return { error: "Server configuration error. Please contact the organiser." };
  }

  // Verify passcode
  const { data: pool, error: poolErr } = await supabase
    .from("pools")
    .select("id, name, passcode")
    .eq("passcode", passcode)
    .single();

  if (poolErr || !pool) {
    return { error: "Invalid passcode. Check with your organiser." };
  }

  // Reject if name is already taken — prevents session hijack via name collision
  const { data: existing } = await supabase
    .from("participants")
    .select("id")
    .eq("pool_id", pool.id)
    .ilike("display_name", displayName)
    .maybeSingle();

  if (existing) {
    return { error: "That name is already taken in this pool. Choose a different name." };
  }

  // Insert new participant (never upsert — avoids silent account hijacking)
  const { data: participant, error: pErr } = await supabase
    .from("participants")
    .insert({ pool_id: pool.id, display_name: displayName })
    .select()
    .single();

  if (pErr || !participant) {
    return { error: pErr?.message || pErr?.details || "Could not create participant. Please try again." };
  }

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_NAME,
    encodeSession({
      participantId: participant.id,
      displayName: participant.display_name,
      poolId: pool.id,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    }
  );

  redirect("/bracket");
}

// ─── Save Pick ────────────────────────────────────────────
export async function lockPick(formData: FormData) {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  const seriesId = formData.get("series_id") as string;
  const pickedTeamId = formData.get("picked_team_id") as string;
  const gamesPredictionRaw = formData.get("games_prediction");
  const gamesPrediction = gamesPredictionRaw ? Number(gamesPredictionRaw) : null;

  if (!seriesId || !pickedTeamId) {
    throw new Error("Missing pick data.");
  }

  // Validate games prediction is within legal range
  if (gamesPrediction !== null && (isNaN(gamesPrediction) || gamesPrediction < 4 || gamesPrediction > 7)) {
    throw new Error("games_prediction must be 4, 5, 6, or 7.");
  }

  const supabase = getAdminClient();

  // Check if pool is locked
  const { data: pool } = await supabase
    .from("pools")
    .select("picks_locked_at")
    .eq("id", session.poolId)
    .single();

  if (pool?.picks_locked_at) {
    throw new Error("Bracket submissions are closed. No changes are allowed.");
  }

  // Validate that the picked team is actually one of the two teams in this series
  const { data: series } = await supabase
    .from("series")
    .select("team_a_id, team_b_id")
    .eq("id", seriesId)
    .single();

  if (!series) {
    throw new Error("Series not found.");
  }

  const validTeams = [series.team_a_id, series.team_b_id].filter(Boolean);
  if (!validTeams.includes(pickedTeamId)) {
    throw new Error("Invalid pick: chosen team is not in this series.");
  }

  const { error } = await supabase.from("picks").upsert(
    {
      participant_id: session.participantId,
      series_id: seriesId,
      picked_team_id: pickedTeamId,
      games_prediction: gamesPrediction,
      locked: false,
    },
    { onConflict: "participant_id,series_id" }
  );

  if (error) throw new Error(error.message);
}

// ─── Logout ─────────────────────────────────────────────────────
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/");
}
