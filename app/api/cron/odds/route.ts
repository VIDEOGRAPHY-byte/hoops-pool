import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { fetchEspnOdds } from "@/lib/odds";

export const runtime = "edge";

export async function GET(req: Request) {
  // Verify cron secret
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminClient();
  const oddsItems = await fetchEspnOdds();

  if (oddsItems.length === 0) {
    return NextResponse.json({ message: "No odds fetched", inserted: 0 });
  }

  // Get teams map
  const { data: teams } = await supabase
    .from("teams")
    .select("id, abbreviation");

  const teamMap = new Map(
    (teams ?? []).map((t: { id: string; abbreviation: string }) => [t.abbreviation, t.id])
  );

  const snapshots = oddsItems
    .filter((item) => teamMap.has(item.teamAbbr))
    .map((item) => ({
      team_id: teamMap.get(item.teamAbbr)!,
      championship_odds: item.championshipOdds,
      r1_win_prob: item.r1WinProb,
    }));

  const { error } = await supabase.from("odds_snapshots").insert(snapshots);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Odds updated", inserted: snapshots.length });
}
