import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Bracket from "@/components/Bracket";
import type { Series, Pick, Team, OddsSnapshot, CommunityPick } from "@/lib/types";

export const revalidate = 60;

async function getData(participantId: string) {
  const [seriesRes, picksRes, teamsRes, oddsRes, allPicksRes] = await Promise.all([
    supabase
      .from("series")
      .select("*, team_a:teams!series_team_a_id_fkey(*), team_b:teams!series_team_b_id_fkey(*), winner:teams!series_winner_id_fkey(*)")
      .order("round")
      .order("slot"),
    supabase
      .from("picks")
      .select("*")
      .eq("participant_id", participantId),
    supabase.from("teams").select("*"),
    supabase.from("odds_snapshots").select("*"),
    supabase
      .from("picks")
      .select("participant_id, series_id, picked_team_id, participants(display_name)"),
  ]);

  const communityPicks: CommunityPick[] = ((allPicksRes.data ?? []) as any[]).map((p) => ({
    participantId: p.participant_id,
    participantName: (p.participants as any)?.display_name ?? "?",
    seriesId: p.series_id,
    pickedTeamId: p.picked_team_id,
  }));

  return {
    series: (seriesRes.data ?? []) as Series[],
    picks: (picksRes.data ?? []) as Pick[],
    teams: (teamsRes.data ?? []) as Team[],
    oddsSnapshots: (oddsRes.data ?? []) as OddsSnapshot[],
    communityPicks,
  };
}

export default async function BracketPage() {
  const session = await getSession();
  if (!session) return null;

  const { series, picks, teams, oddsSnapshots, communityPicks } = await getData(session.participantId);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1.5rem",
        }}
      >
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
          }}
        >
          Your Bracket
        </h1>
        <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          â {session.displayName}
        </span>
      </div>

      <Bracket
        series={series}
        picks={picks}
        teams={teams}
        oddsSnapshots={oddsSnapshots}
        participantId={session.participantId}
        communityPicks={communityPicks}
      />
    </div>
  );
}
