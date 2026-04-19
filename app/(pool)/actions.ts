"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/supabase";
import { encodeSession, SESSION_COOKIE_NAME } from "@/lib/auth";

// ─── Join Pool ────────────────────────────────────────────────
export async function joinPool(formData: FormData) {
  const displayName = (formData.get("displayName") as string)?.trim();
  const passcode = (formData.get("passcode") as string)?.trim().toUpperCase();

  if (!displayName || !passcode) {
    throw new Error("Name and passcode are required.");
  }

  const supabase = getAdminClient();

  // Verify passcode
  const { data: pool, error: poolErr } = await supabase
    .from("pools")
    .select("id, name, passcode")
    .eq("passcode", passcode)
    .single();

  if (poolErr || !pool) {
    throw new Error("Invalid passcode. Check with your organiser.");
  }

  // Upsert participant
  const { data: participant, error: pErr } = await supabase
    .from("participants")
    .upsert(
      { pool_id: pool.id, display_name: displayName },
      { onConflict: "pool_id,display_name" }
    )
    .select()
    .single();

  if (pErr || !participant) {
    throw new Error("Could not create participant. Please try again.");
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

// ─── Lock Pick ────────────────────────────────────────────────
export async function lockPick(formData: FormData) {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  const seriesId = formData.get("series_id") as string;
  const pickedTeamId = formData.get("picked_team_id") as string;
  const gamesPrediction = formData.get("games_prediction")
    ? Number(formData.get("games_prediction"))
    : null;

  if (!seriesId || !pickedTeamId) {
    throw new Error("Missing pick data.");
  }

  const supabase = getAdminClient();

  // Check series is not locked
  const { data: series } = await supabase
    .from("series")
    .select("locked")
    .eq("id", seriesId)
    .single();

  if (series?.locked) {
    throw new Error("This series is locked. Picks are no longer accepted.");
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

// ─── Logout ───────────────────────────────────────────────────
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/");
}
