import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const body = await req.json();
  const { series_id, winner_id, games } = body;

  if (!series_id || !winner_id) {
    return NextResponse.json({ error: "series_id and winner_id required" }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { error } = await supabase
    .from("series")
    .update({ winner_id, games: games ?? null, locked: true })
    .eq("id", series_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
