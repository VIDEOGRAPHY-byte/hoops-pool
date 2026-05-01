import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { scoreParticipant, totalScore } from "@/lib/scoring";
import type { Participant, Pick, Series } from "@/lib/types";

export const revalidate = 60;

const ROUND_LABELS: Record<number, string> = {
  1: "R1",
  2: "R2",
  3: "CF",
  4: "Finals",
};

async function getData() {
  const [participantsRes, picksRes, seriesRes] = await Promise.all([
    supabase.from("participants").select("*"),
    supabase.from("picks").select("*"),
    supabase
      .from("series")
      .select(
        "*, team_a:teams!series_team_a_id_fkey(*), team_b:teams!series_team_b_id_fkey(*), winner:teams!series_winner_id_fkey(*)"
      )
      .order("round")
      .order("conference")
      .order("slot"),
  ]);

  return {
    participants: (participantsRes.data ?? []) as Participant[],
    picks: (picksRes.data ?? []) as Pick[],
    series: (seriesRes.data ?? []) as Series[],
  };
}

export default async function FactCheckPage() {
  const session = await getSession();
  const { participants, picks, series } = await getData();

  // Only show series that have at least one team set (exclude empty placeholder slots)
  const activeSeries = series.filter((s) => s.team_a_id || s.team_b_id);

  // Build pick lookup: participantId → seriesId → pick
  const pickMap = new Map<string, Map<string, Pick>>();
  for (const pick of picks) {
    if (!pickMap.has(pick.participant_id)) pickMap.set(pick.participant_id, new Map());
    pickMap.get(pick.participant_id)!.set(pick.series_id, pick);
  }

  // Score each participant and sort by total desc
  type Row = {
    participant: Participant;
    totalPts: number;
    correctCount: number;
    picks: Map<string, Pick>;
  };

  const rows: Row[] = participants
    .map((p) => {
      const myPicks = picks.filter((pk) => pk.participant_id === p.id);
      const breakdown = scoreParticipant(myPicks, series);
      return {
        participant: p,
        totalPts: totalScore(breakdown),
        correctCount: breakdown.filter((b) => b.correct).length,
        picks: pickMap.get(p.id) ?? new Map(),
      };
    })
    .sort((a, b) => b.totalPts - a.totalPts || b.correctCount - a.correctCount);

  // Point values per round
  const ROUND_PTS: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 8 };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
          Fact Check
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.3rem" }}>
          Every pick, every series, every point — laid out in full
        </p>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: "1.25rem",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
        }}
      >
        {[
          { color: "rgba(34,197,94,0.18)", border: "rgba(34,197,94,0.5)", label: "✓ Correct" },
          { color: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.4)", label: "✗ Wrong" },
          { color: "var(--bg-card)", border: "var(--border)", label: "— In progress" },
          { color: "var(--bg)", border: "var(--border)", label: "· No pick" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                background: item.color,
                border: `1px solid ${item.border}`,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: "0.775rem", color: "var(--text-muted)" }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Scrollable table wrapper */}
      <div
        className="card"
        style={{ padding: 0, overflow: "hidden" }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.8rem",
              minWidth: 600,
            }}
          >
            {/* ── Column headers ── */}
            <thead>
              {/* Round grouping row */}
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th
                  style={{
                    padding: "0.6rem 1rem",
                    textAlign: "left",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    position: "sticky",
                    left: 0,
                    background: "var(--bg-card)",
                    zIndex: 2,
                    borderRight: "1px solid var(--border)",
                  }}
                  rowSpan={2}
                >
                  Player
                </th>

                {/* Series columns — one per active series */}
                {activeSeries.map((s) => {
                  const teamA = (s as any).team_a?.abbreviation ?? "TBD";
                  const teamB = (s as any).team_b?.abbreviation ?? "TBD";
                  const winner = (s as any).winner;
                  const pts = ROUND_PTS[s.round] ?? 1;

                  return (
                    <th
                      key={s.id}
                      style={{
                        padding: "0.45rem 0.5rem",
                        textAlign: "center",
                        fontWeight: 500,
                        color: "var(--text-muted)",
                        borderLeft: "1px solid var(--border)",
                        minWidth: 72,
                        lineHeight: 1.2,
                        background: winner ? "rgba(34,197,94,0.04)" : "var(--bg-card)",
                      }}
                    >
                      <div style={{ fontSize: "0.65rem", color: "var(--text-dim)", marginBottom: 2 }}>
                        {ROUND_LABELS[s.round]} · {pts}pt{pts > 1 ? "s" : ""}
                      </div>
                      <div style={{ fontWeight: 700, color: "var(--text)", fontSize: "0.75rem" }}>
                        {teamA}
                      </div>
                      <div style={{ fontSize: "0.62rem", color: "var(--text-dim)" }}>vs</div>
                      <div style={{ fontWeight: 700, color: "var(--text)", fontSize: "0.75rem" }}>
                        {teamB}
                      </div>
                      {winner && (
                        <div
                          style={{
                            fontSize: "0.6rem",
                            color: "#22c55e",
                            fontWeight: 700,
                            marginTop: 2,
                          }}
                        >
                          {winner.abbreviation} ✓{s.games ? ` in ${s.games}` : ""}
                        </div>
                      )}
                    </th>
                  );
                })}

                {/* Total column header */}
                <th
                  style={{
                    padding: "0.6rem 0.75rem",
                    textAlign: "center",
                    fontWeight: 700,
                    color: "var(--text)",
                    borderLeft: "2px solid var(--border)",
                    whiteSpace: "nowrap",
                    background: "var(--bg-card)",
                    position: "sticky",
                    right: 0,
                    zIndex: 2,
                  }}
                  rowSpan={2}
                >
                  Total
                </th>
              </tr>
            </thead>

            {/* ── Participant rows ── */}
            <tbody>
              {rows.map((row, i) => {
                const isMe = row.participant.id === session?.participantId;
                const medals = ["🥇", "🥈", "🥉"];
                const rank = i + 1;

                return (
                  <tr
                    key={row.participant.id}
                    style={{
                      borderTop: "1px solid var(--border)",
                      background: isMe ? "var(--accent-glow)" : "transparent",
                    }}
                  >
                    {/* Name cell */}
                    <td
                      style={{
                        padding: "0.55rem 1rem",
                        whiteSpace: "nowrap",
                        position: "sticky",
                        left: 0,
                        background: isMe
                          ? "var(--accent-glow)"
                          : i % 2 === 0
                          ? "var(--bg-card)"
                          : "var(--bg)",
                        zIndex: 1,
                        borderRight: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-dim)", width: 20, flexShrink: 0 }}>
                          {rank <= 3 ? medals[rank - 1] : rank}
                        </span>
                        <span style={{ fontWeight: isMe ? 700 : 500, color: "var(--text)" }}>
                          {row.participant.display_name}
                        </span>
                        {isMe && (
                          <span
                            style={{
                              fontSize: "0.6rem",
                              fontWeight: 700,
                              color: "var(--accent)",
                              background: "rgba(99,102,241,0.15)",
                              padding: "1px 5px",
                              borderRadius: 999,
                            }}
                          >
                            YOU
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Series pick cells */}
                    {activeSeries.map((s) => {
                      const pick = row.picks.get(s.id);
                      const winner = (s as any).winner;
                      const seriesComplete = !!winner;

                      if (!pick) {
                        return (
                          <td
                            key={s.id}
                            style={{
                              padding: "0.55rem 0.5rem",
                              textAlign: "center",
                              borderLeft: "1px solid var(--border)",
                              color: "var(--text-dim)",
                              fontSize: "0.7rem",
                            }}
                          >
                            —
                          </td>
                        );
                      }

                      const pickedTeamId = pick.picked_team_id;
                      const pickedTeam =
                        pickedTeamId === s.team_a_id
                          ? (s as any).team_a
                          : pickedTeamId === s.team_b_id
                          ? (s as any).team_b
                          : null;
                      const pickedAbbr = pickedTeam?.abbreviation ?? "?";

                      const correct = seriesComplete && winner?.id === pickedTeamId;
                      const wrong = seriesComplete && winner?.id !== pickedTeamId;
                      const pts = ROUND_PTS[s.round] ?? 1;
                      const gamesBonus =
                        correct && pick.games_prediction != null && pick.games_prediction === s.games
                          ? 1
                          : 0;
                      const ptsEarned = correct ? pts + gamesBonus : 0;

                      return (
                        <td
                          key={s.id}
                          style={{
                            padding: "0.45rem 0.5rem",
                            textAlign: "center",
                            borderLeft: "1px solid var(--border)",
                            background: correct
                              ? "rgba(34,197,94,0.12)"
                              : wrong
                              ? "rgba(239,68,68,0.08)"
                              : "transparent",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              color: correct
                                ? "#22c55e"
                                : wrong
                                ? "#ef4444"
                                : "var(--text)",
                            }}
                          >
                            {pickedAbbr}
                          </div>
                          {pick.games_prediction != null && (
                            <div style={{ fontSize: "0.6rem", color: "var(--text-dim)" }}>
                              in {pick.games_prediction}
                            </div>
                          )}
                          {seriesComplete && (
                            <div
                              style={{
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                color: correct ? "#22c55e" : "#ef4444",
                                marginTop: 1,
                              }}
                            >
                              {correct ? `+${ptsEarned}` : "✗"}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Total cell */}
                    <td
                      style={{
                        padding: "0.55rem 0.75rem",
                        textAlign: "center",
                        fontWeight: 800,
                        fontSize: "1rem",
                        color: isMe ? "var(--accent)" : "var(--text)",
                        borderLeft: "2px solid var(--border)",
                        whiteSpace: "nowrap",
                        position: "sticky",
                        right: 0,
                        background: isMe
                          ? "var(--accent-glow)"
                          : i % 2 === 0
                          ? "var(--bg-card)"
                          : "var(--bg)",
                        zIndex: 1,
                      }}
                    >
                      {row.totalPts}
                      <span
                        style={{
                          fontSize: "0.65rem",
                          fontWeight: 400,
                          color: "var(--text-dim)",
                          marginLeft: 3,
                        }}
                      >
                        ({row.correctCount}✓)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--text-dim)" }}>
        Points: R1 = 1pt · R2 = 2pts · Conf Finals = 4pts · NBA Finals = 8pts · +1 bonus for correct games prediction
      </p>
    </div>
  );
}
