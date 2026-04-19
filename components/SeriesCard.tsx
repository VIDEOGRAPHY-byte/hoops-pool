"use client";

import type { Series, Pick, OddsSnapshot } from "@/lib/types";

interface SeriesCardProps {
  series: Series;
  pick: Pick | undefined;
  oddsMap: Map<string, OddsSnapshot>;
  showOdds: boolean;
  onPickClick: (series: Series) => void;
}

export default function SeriesCard({ series, pick, oddsMap, showOdds, onPickClick }: SeriesCardProps) {
  const { team_a, team_b, winner, locked, round } = series;
  const isComplete = !!winner;
  const hasBothTeams = !!(team_a && team_b);
  const canPick = !locked && hasBothTeams;
  const hasPick = !!pick;
  const pickedId = pick?.picked_team_id;

  const roundLabel: Record<number, string> = { 1: "R1", 2: "R2", 3: "CF", 4: "Finals" };
  const confLabel = series.conference === "Finals" ? "Finals" : `${roundLabel[round]} · ${series.conference}`;

  function TeamRow({ team, isWinner, isPicked }: { team: NonNullable<Series["team_a"]>; isWinner: boolean; isPicked: boolean }) {
    const odds = showOdds ? oddsMap.get(team.id) : undefined;
    const winProb = odds?.r1_win_prob;
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.35rem 0.5rem", borderRadius: 6, background: isPicked ? "var(--accent-glow)" : isWinner ? "rgba(34,197,94,0.08)" : "transparent", opacity: isComplete && !isWinner ? 0.4 : 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {isPicked && <span style={{ fontSize: "0.65rem", color: "var(--accent)" }}>✓</span>}
          {isWinner && <span style={{ fontSize: "0.65rem" }}>🏆</span>}
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", minWidth: 16, fontWeight: 600 }}>{team.seed}</span>
          <span style={{ fontSize: "0.85rem", fontWeight: isPicked || isWinner ? 700 : 500, color: isPicked ? "var(--accent)" : isWinner ? "var(--success, #22c55e)" : "var(--text)" }}>{team.abbreviation}</span>
        </div>
        {winProb !== undefined && <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>{(winProb * 100).toFixed(0)}%</span>}
        {!winProb && odds && <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>{odds.championship_odds > 0 ? `+${odds.championship_odds}` : odds.championship_odds}</span>}
      </div>
    );
  }

  return (
    <div
      onClick={() => canPick && onPickClick(series)}
      style={{ background: "var(--bg-card)", border: `1px solid ${hasPick ? "var(--accent)" : "var(--border)"}`, borderRadius: "var(--radius)", padding: "0.6rem 0.5rem", cursor: canPick ? "pointer" : locked ? "not-allowed" : "default", transition: "border-color 0.15s, box-shadow 0.15s", minWidth: 130, maxWidth: 160, position: "relative", boxShadow: hasPick ? "0 0 0 1px var(--accent)" : "none" }}
      onMouseEnter={(e) => { if (canPick) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = hasPick ? "var(--accent)" : "var(--border)"; }}
    >
      {hasPick && (
        <div style={{ position: "absolute", top: 5, right: 5, fontSize: "0.6rem", fontWeight: 700, color: "var(--accent)", background: "var(--accent-glow)", border: "1px solid var(--accent)", borderRadius: 4, padding: "1px 4px", letterSpacing: "0.04em" }}>
          LOCKED
        </div>
      )}
      <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-dim)", letterSpacing: "0.06em", marginBottom: "0.3rem", display: "flex", justifyContent: "space-between", paddingRight: hasPick ? "2.5rem" : 0 }}>
        <span>{confLabel}</span>
        {!hasPick && hasBothTeams && !locked && <span style={{ color: "var(--text-dim)", fontWeight: 400 }}>Tap to pick</span>}
        {locked && <span>🔒</span>}
        {!hasBothTeams && <span style={{ color: "var(--text-dim)", fontWeight: 400 }}>TBD</span>}
      </div>
      {team_a ? <TeamRow team={team_a} isWinner={winner?.id === team_a.id} isPicked={pickedId === team_a.id} /> : <div style={{ color: "var(--text-dim)", fontSize: "0.8rem", padding: "0.3rem 0.5rem" }}>Awaiting winner</div>}
      <div style={{ height: 1, background: "var(--border)", margin: "0.2rem 0" }} />
      {team_b ? <TeamRow team={team_b} isWinner={winner?.id === team_b.id} isPicked={pickedId === team_b.id} /> : <div style={{ color: "var(--text-dim)", fontSize: "0.8rem", padding: "0.3rem 0.5rem" }}>Awaiting winner</div>}
      {hasPick && (
        <div style={{ marginTop: "0.3rem", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.25rem", borderTop: "1px solid var(--border)" }}>
          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--accent)", letterSpacing: "0.04em" }}>
            YOUR PICK: {[team_a, team_b].find((t) => t?.id === pickedId)?.abbreviation ?? "—"}
          </span>
          {pick?.games_prediction && <span style={{ fontSize: "0.65rem", color: "var(--text-dim)" }}>in {pick.games_prediction}</span>}
        </div>
      )}
    </div>
  );
}
