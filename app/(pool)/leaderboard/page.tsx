import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import LeaderboardTable from "@/components/Leaderboard";
import { scoreParticipant, totalScore, maxPossible } from "@/lib/scoring";
import type { Participant, Pick, Series, LeaderboardEntry } from "@/lib/types";

export const revalidate = 60;

async function getData() {
  const [participantsRes, picksRes, seriesRes] = await Promise.all([
    supabase.from("participants").select("*"),
    supabase.from("picks").select("*"),
    supabase.from("series").select("*"),
  ]);

  return {
    participants: (participantsRes.data ?? []) as Participant[],
    picks: (picksRes.data ?? []) as Pick[],
    series: (seriesRes.data ?? []) as Series[],
  };
}

export default async function LeaderboardPage() {
  const session = await getSession();
  const { participants, picks, series } = await getData();

  const entries: LeaderboardEntry[] = participants
    .map((p) => {
      const myPicks = picks.filter((pk) => pk.participant_id === p.id);
      const breakdown = scoreParticipant(myPicks, series);
      return {
        participant: p,
        total_points: totalScore(breakdown),
        correct_picks: breakdown.filter((b) => b.correct).length,
        possible_points: maxPossible(breakdown),
        rank: 0,
      };
    })
    .sort((a, b) => b.total_points - a.total_points)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          marginBottom: "1.5rem",
        }}
      >
        Leaderboard
      </h1>
      <LeaderboardTable
        entries={entries}
        currentParticipantId={session?.participantId}
      />
    </div>
  );
}
