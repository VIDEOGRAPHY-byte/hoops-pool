import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { Series } from "@/lib/types";

export const revalidate = 60;

const ROUND_LABELS: Record<number, string> = {
  1: "First Round",
  2: "Conference Semifinals",
  3: "Conference Finals",
  4: "NBA Finals",
};

const CONF_ORDER = ["West", "East", "Finals"] as const;

async function getData(myId: string) {
  const [seriesRes, picksRes] = await Promise.all([
    supabase
      .from("series")
      .select(
        "*, team_a:teams!series_team_a_id_fkey(*), team_b:teams!series_team_b_id_fkey(*), winner:teams!series_winner_id_fkey(*)"
      )
      .order("round")
      .order("slot"),
    supabase
      .from("picks")
      .select("participant_id, series_id, picked_team_id, participants(display_name)"),
  ]);

  const allPicks = ((picksRes.data ?? []) as any[]).map((p) => ({
    participantId: p.participant_id as string,
    participantName: ((p.participants as any)?.display_name ?? "?") as string,
    seriesId: p.series_id as string,
    pickedTeamId: p.picked_team_id as string,
  }));

  return {
    series: (seriesRes.data ?? []) as Series[],
    allPicks,
    myId,
  };
}

export default async function CommunityPage() {
  const session = await getSession();
  if (!session) return null;

  const { series, allPicks, myId } = await getData(session.participantId);

  const rounds = [1, 2, 3, 4] as const;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
          Community Picks
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.3rem" }}>
          Who the pool is picking â round by round
        </p>
      </div>

      {rounds.map((round) => {
        const roundSeries = series
          .filter((s) => s.round === round)
          .sort((a, b) => {
            const ci = (c: Series["conference"]) =>
              c === "West" ? 0 : c === "East" ? 1 : 2;
            return ci(a.conference) - ci(b.conference) || a.slot - b.slot;
          });

        if (roundSeries.length === 0) return null;

        return (
          <div key={round} style={{ marginBottom: "2.25rem" }}>
            {/* Round label */}
            <div
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "0.75rem",
                paddingBottom: "0.5rem",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {ROUND_LABELS[round]}
            </div>

            {/* Series cards grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "0.65rem",
              }}
            >
              {roundSeries.map((s) => {
                const aPicks = allPicks.filter(
                  (p) => p.seriesId === s.id && p.pickedTeamId === s.team_a_id
                );
                const bPicks = allPicks.filter(
                  (p) => p.seriesId === s.id && p.pickedTeamId === s.team_b_id
                );
                const total = aPicks.length + bPicks.length;
                const aPct = total > 0 ? Math.round((aPicks.length / total) * 100) : 50;
                const bPct = total > 0 ? 100 - aPct : 50;
                const teamAName = s.team_a?.abbreviation ?? "TBD";
                const teamBName = s.team_b?.abbreviation ?? "TBD";
                const aWon = !!s.winner && s.winner.id === s.team_a_id;
                const bWon = !!s.winner && s.winner.id === s.team_b_id;

                return (
                  <div
                    key={s.id}
                    style={{
                      background: "var(--bg-card)",
                      border: `1px solid ${s.winner ? "rgba(34,197,94,0.18)" : "var(--border)"}`,
                      borderRadius: "var(--radius)",
                      overflow: "hidden",
                    }}
                  >
                    {/* Matchup header */}
                    <div
                      style={{
                        padding: "0.55rem 0.85rem",
                        borderBottom: "1px solid var(--border)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                        <span style={{ color: total > 0 ? "#3b82f6" : "var(--text)" }}>
                          {teamAName}
                        </span>
                        <span style={{ color: "var(--text-dim)", margin: "0 5px" }}>vs</span>
                        <span style={{ color: total > 0 ? "#f97316" : "var(--text)" }}>
                          {teamBName}
                        </span>
                      </span>
                      {s.winner ? (
                        <span
                          style={{
                            fontSize: "0.63rem",
                            fontWeight: 700,
                            color: "#22c55e",
                            background: "rgba(34,197,94,0.10)",
                            padding: "2px 7px",
                            borderRadius: 999,
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {s.winner.abbreviation} â
                        </span>
                      ) : total > 0 ? (
                        <span
                          style={{
                            fontSize: "0.63rem",
                            color: "var(--text-dim)",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {total} pick{total !== 1 ? "s" : ""}
                        </span>
                      ) : null}
                    </div>

                    {/* Split bar */}
                    {total > 0 && (
                      <div style={{ height: 3, display: "flex" }}>
                        <div
                          style={{
                            width: `${aPct}%`,
                            background: "#3b82f6",
                            transition: "width 0.3s",
                          }}
                        />
                        <div style={{ flex: 1, background: "#f97316" }} />
                      </div>
                    )}

                    {/* Two-column picker list */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                      {/* Team A pickers */}
                      <PickerColumn
                        picks={aPicks}
                        color="#3b82f6"
                        label={teamAName}
                        pct={aPct}
                        showPct={total > 0}
                        won={aWon}
                        myId={myId}
                        borderRight
                      />
                      {/* Team B pickers */}
                      <PickerColumn
                        picks={bPicks}
                        color="#f97316"
                        label={teamBName}
                        pct={bPct}
                        showPct={total > 0}
                        won={bWon}
                        myId={myId}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ââ Picker column ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function PickerColumn({
  picks,
  color,
  label,
  pct,
  showPct,
  won,
  myId,
  borderRight,
}: {
  picks: { participantId: string; participantName: string }[];
  color: string;
  label: string;
  pct: number;
  showPct: boolean;
  won: boolean;
  myId: string;
  borderRight?: boolean;
}) {
  return (
    <div
      style={{
        padding: "0.6rem 0.75rem",
        borderRight: borderRight ? "1px solid var(--border)" : undefined,
      }}
    >
      {/* Column header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.45rem",
        }}
      >
        <span
          style={{
            fontSize: "0.68rem",
            fontWeight: 700,
            color: won ? "#22c55e" : color,
            letterSpacing: "0.02em",
          }}
        >
          {label}
          {won && " â"}
        </span>
        {showPct && (
          <span style={{ fontSize: "0.65rem", color: "var(--text-dim)", fontFamily: "var(--mono)" }}>
            {pct}%
          </span>
        )}
      </div>

      {/* Picker names */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {picks.length === 0 ? (
          <span style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>â</span>
        ) : (
          picks.map((p) => {
            const isMe = p.participantId === myId;
            return (
              <div
                key={p.participantId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {isMe && (
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "#3b82f6",
                      flexShrink: 0,
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: isMe ? 700 : 400,
                    color: won ? "#22c55e" : isMe ? "#3b82f6" : "var(--text)",
                    lineHeight: 1.3,
                  }}
                >
                  {p.participantName}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
