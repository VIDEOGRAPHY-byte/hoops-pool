import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Bracket from "@/components/Bracket";
import type { Series, Pick, Team } from "@/lib/types";

export const revalidate = 60;

async function getData(participantId: string) {
  const [seriesRes, picksRes, teamsRes] = await Promise.all([
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
  ]);

  return {
    series: (seriesRes.data ?? []) as Series[],
    picks: (picksRes.data ?? []) as Pick[],
    teams: (teamsRes.data ?? []) as Team[],
  };
}

export default async function BracketPage() {
  const session = await getSession();
  if (!session) return null;

  const { series, picks, teams } = await getData(session.participantId);

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
          — {session.displayName}
        </span>
      </div>

      <Bracket
        series={series}
        picks={picks}
        teams={teams}
        participantId={session.participantId}
      />
    </div>
  );
}
