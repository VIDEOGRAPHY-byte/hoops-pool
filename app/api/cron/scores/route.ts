import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// ESPN NBA playoff scoreboard — groups=21 is the NBA playoffs bracket
const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?groups=21&limit=100";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

export async function GET(req: Request) {
  // Verify cron secret
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminClient();

  // 1. Fetch open series (both teams set, no winner yet)
  const { data: openSeries, error: seriesErr } = await supabase
    .from("series")
    .select("id, team_a_id, team_b_id, round")
    .is("winner_id", null)
    .not("team_a_id", "is", null)
    .not("team_b_id", "is", null);

  if (seriesErr) {
    return NextResponse.json({ error: seriesErr.message }, { status: 500 });
  }
  if (!openSeries || openSeries.length === 0) {
    return NextResponse.json({ message: "All series already have winners", updated: 0 });
  }

  // 2. Get team abbreviations for all relevant teams
  const allTeamIds = [
    ...openSeries.map((s) => s.team_a_id as string),
    ...openSeries.map((s) => s.team_b_id as string),
  ];
  const teamIds = allTeamIds.filter((id, idx) => allTeamIds.indexOf(id) === idx);

  const { data: teams } = await supabase
    .from("teams")
    .select("id, abbreviation")
    .in("id", teamIds);

  const teamById = new Map((teams ?? []).map((t) => [t.id, t]));
  const teamByAbbr = new Map((teams ?? []).map((t) => [t.abbreviation as string, t.id as string]));

  // 3. Fetch ESPN playoff scoreboard
  let espnData: AnyObj;
  try {
    const res = await fetch(ESPN_SCOREBOARD_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`ESPN returned ${res.status}`);
    espnData = await res.json();
  } catch (err) {
    return NextResponse.json({ error: `ESPN fetch failed: ${String(err)}` }, { status: 502 });
  }

  const events: AnyObj[] = espnData?.events ?? [];

  // 4. Build a map: sorted-abbr-key → { winnerAbbr, totalGames }
  //    We scan every competition in every event looking for series with a winner (wins === 4)
  const completedSeries = new Map<string, { winnerAbbr: string; totalGames: number }>();

  for (const event of events) {
    const competitions: AnyObj[] = event?.competitions ?? [];
    for (const comp of competitions) {
      const seriesData: AnyObj = comp?.series;
      if (!seriesData) continue;

      const participants: AnyObj[] = seriesData?.seriesParticipants ?? [];
      if (participants.length !== 2) continue;

      // Check if series is over (a team has 4 wins)
      const winner = participants.find((p) => Number(p.wins) === 4);
      if (!winner) continue;

      const loser = participants.find((p) => Number(p.wins) !== 4);
      const totalGames = Number(winner.wins ?? 0) + Number(loser?.wins ?? 0);

      // Match the winning participant ID to a competitor team abbreviation
      const competitors: AnyObj[] = comp?.competitors ?? [];
      const winnerComp = competitors.find(
        (c) => c.id === winner.id || c.uid === winner.uid
      );
      const winnerAbbr: string | undefined = winnerComp?.team?.abbreviation;
      if (!winnerAbbr) continue;

      // Key by sorted abbreviations so team ordering doesn't matter
      const abbrs = competitors
        .map((c) => c.team?.abbreviation as string | undefined)
        .filter(Boolean) as string[];
      if (abbrs.length !== 2) continue;

      const key = abbrs.sort().join("~");
      // Only store the first/most recent completed result for this matchup
      if (!completedSeries.has(key)) {
        completedSeries.set(key, { winnerAbbr, totalGames });
      }
    }
  }

  // 5. Update each open series that ESPN says is complete
  let updated = 0;
  const results: string[] = [];

  for (const s of openSeries) {
    const teamA = teamById.get(s.team_a_id);
    const teamB = teamById.get(s.team_b_id);
    if (!teamA || !teamB) continue;

    const key = [teamA.abbreviation, teamB.abbreviation].sort().join("~");
    const completion = completedSeries.get(key);
    if (!completion) continue;

    const winnerId = teamByAbbr.get(completion.winnerAbbr);
    if (!winnerId) continue;

    const { error } = await supabase
      .from("series")
      .update({ winner_id: winnerId, games: completion.totalGames })
      .eq("id", s.id);

    if (!error) {
      updated++;
      results.push(
        `${teamA.abbreviation} vs ${teamB.abbreviation} → ${completion.winnerAbbr} in ${completion.totalGames}`
      );
    }
  }

  return NextResponse.json({ message: "Scores updated", updated, results });
}
