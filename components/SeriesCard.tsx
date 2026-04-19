"use client";

import type { Series, Pick, OddsSnapshot } from "@/lib/types";

interface SeriesCardProps {
  series: Series;
  pick: Pick | undefined;
  oddsMap: Map<string, OddsSnapshot>;
  showOdds: boolean;
  onPickClick: (series: Series) => void;
}

export default function SeriesCard({
  series,
  pick,
  oddsMap,
  showOdds,
  onPickClick,
}: SeriesCardProps) {
  const { team_a, team_b, winner, locked, round } = series;
  const isComplete = !!winner;
  const canPick = !locked && (team_a || team_b);

  const pickedId = pick?.picked_team_id;

  const roundLabel: Record<number, string> = {
    1: "R1",
    2: "R2",
    3: "CF",
    4: "Finals",
  };

  function TeamRow({
    team,
    isWinner,
    isPicked,
  }: {
    team: NonNullable<Series["team_a"]>;
    isWinner: boolean;
    isPicked: boolean;
  }) {
    const odds = showOdds ? oddsMap.get(team.id) : undefined;
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.35rem 0.5rem",
          borderRadius: 6,
          background: isPicked
            ? "var(--accent-glow)"
            : isWinner
            ? "rgba(34,197,94,0.08)"
            : "transparent",
          opacity: isComplete && !isWinner ? 0.4 : 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {isPicked && (
            <span style={{ fontSize: "0.65rem", color: "var(--accent)" }}>✓</span>
          )}
          {isWinner && (
            <span style={{ fontSize: "0.65rem", color: "var(--success)" }}>🏆</span>
          )}
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              minWidth: 16,
              fontWeight: 600,
            }}
          >
            {team.seed}
          </span>
          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: isPicked || isWinner ? 700 : 500,
              color: isPicked ? "var(--accent)" : isWinner ? "var(--success)" : "var(--text)",
            }}
          >
            {team.abbreviation}
          </span>
        </div>
        {odds && (
          <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
            {odds.championship_odds > 0
              ? `+${odds.championship_odds}`
              : odds.championship_odds}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => canPick && onPickClick(series)}
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${locked ? "var(--border)" : "var(--border)"}`,
        borderRadius: "var(--radius)",
        padding: "0.6rem 0.5rem",
        cursor: canPick ? "pointer" : "default",
        transition: "border-color 0.15s, box-shadow 0.15s",
        minWidth: 130,
        maxWidth: 160,
      }}
      onMouseEnter={(e) => {
        if (canPick)
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
      }}
    >
      {/* Round badge */}
      <div
        style={{
          fontSize: "0.65rem",
          fontWeight: 700,
          color: "var(--text-dim)",
          letterSpacing: "0.06em",
          marginBottom: "0.3rem",
        }}
      >
        {roundLabel[round]} {locked && "🔒"}
      </div>

      {team_a ? (
        <TeamRow
          team={team_a}
          isWinner={winner?.id === team_a.id}
          isPicked={pickedId === team_a.id}
        />
      ) : (
        <div style={{ color: "var(--text-dim)", fontSize: "0.8rem", padding: "0.3rem 0.5rem" }}>TBD</div>
      )}

      <div style={{ height: 1, background: "var(--border)", margin: "0.2rem 0" }} />

      {team_b ? (
        <TeamRow
          team={team_b}
          isWinner={winner?.id === team_b.id}
          isPicked={pickedId === team_b.id}
        />
      ) : (
        <div style={{ color: "var(--text-dim)", fontSize: "0.8rem", padding: "0.3rem 0.5rem" }}>TBD</div>
      )}

      {pick?.games_prediction && (
        <div
          style={{
            marginTop: "0.3rem",
            fontSize: "0.7rem",
            color: "var(--text-muted)",
            textAlign: "center",
          }}
        >
          in {pick.games_prediction}
        </div>
      )}
    </div>
  );
}
