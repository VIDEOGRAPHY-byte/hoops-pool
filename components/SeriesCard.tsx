"use client";

import { useState } from "react";
import type { Series, Pick, OddsSnapshot } from "@/lib/types";

// Card dimensions â match design constants
export const CARD_H = 96;   // total height per matchup (2 Ã 48 px team rows)
const TEAM_H = CARD_H / 2;  // 48 px per team row

interface SeriesCardProps {
  series: Series;
  pick: Pick | undefined;
  oddsMap: Map<string, OddsSnapshot>;
  showOdds: boolean;
  onPickClick: (series: Series) => void;
}

// NBA team brand colors keyed by abbreviation
const TEAM_COLORS: Record<string, string> = {
  OKC: '#007AC1', PHX: '#E56020', LAL: '#552583', HOU: '#CE1141',
  SAS: '#C4CED4', POR: '#E03A3E', DEN: '#0E2240', MIN: '#0C2340',
  DET: '#C8102E', ORL: '#0077C0', CLE: '#860038', TOR: '#CE1141',
  BOS: '#007A33', PHI: '#006BB6', NYK: '#006BB6', ATL: '#E03A3E',
};
function teamColor(abbr: string) {
  return TEAM_COLORS[abbr] ?? '#3b82f6';
}

// ââ Team Row âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function TeamRow({
  team,
  isWinner,
  isLoser,
  isPicked,
  showOdds,
  oddsMap,
}: {
  team: NonNullable<Series['team_a']> | undefined;
  isWinner: boolean;
  isLoser: boolean;
  isPicked: boolean;
  showOdds: boolean;
  oddsMap: Map<string, OddsSnapshot>;
}) {
  const [hover, setHover] = useState(false);
  const empty = !team;
  const color = team ? teamColor(team.abbreviation) : '#3b82f6';

  const odds = showOdds && team ? oddsMap.get(team.id) : undefined;
  const winProb = odds?.r1_win_prob != null
    ? `${Math.round(odds.r1_win_prob * 100)}%`
    : null;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: TEAM_H,
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '0 11px',
        background: hover && !empty
          ? 'rgba(255,255,255,0.025)'
          : isPicked
          ? 'rgba(59,130,246,0.06)'
          : isWinner
          ? 'rgba(34,197,94,0.06)'
          : 'transparent',
        borderLeft: `2px solid ${
          isPicked ? '#3b82f6'
          : isWinner ? '#22c55e'
          : 'transparent'
        }`,
        opacity: isLoser ? 0.35 : 1,
        transition: 'all 0.15s',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 26, height: 26, borderRadius: '50%',
        background: empty
          ? 'rgba(255,255,255,0.04)'
          : isLoser
          ? 'rgba(255,255,255,0.04)'
          : color + '22',
        border: `1.5px ${empty ? 'dashed' : 'solid'} ${
          empty ? 'rgba(255,255,255,0.10)'
          : isLoser ? 'rgba(255,255,255,0.06)'
          : color + '55'
        }`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.2s',
      }}>
        {team && (
          <span style={{
            fontSize: 7.5, fontWeight: 700,
            color: isLoser ? 'rgba(255,255,255,0.25)' : '#fff',
            letterSpacing: '-0.01em',
            fontFamily: 'var(--mono)',
          }}>
            {team.abbreviation}
          </span>
        )}
      </div>

      {/* Seed + name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {team && (
            <span style={{
              fontSize: 10, fontWeight: 500,
              color: 'rgba(255,255,255,0.22)',
              flexShrink: 0,
              fontFamily: 'var(--mono)',
              minWidth: 12,
            }}>
              {team.seed}
            </span>
          )}
          <span style={{
            fontSize: 12.5,
            fontWeight: isPicked || isWinner ? 600 : 400,
            color: empty
              ? 'rgba(255,255,255,0.2)'
              : isPicked ? '#3b82f6'
              : isWinner ? '#22c55e'
              : 'rgba(255,255,255,0.82)',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {team ? team.abbreviation : 'â'}
          </span>
        </div>
        {team && showOdds && winProb && (
          <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
            {winProb} series
          </div>
        )}
      </div>

      {/* State indicator */}
      {(isPicked || isWinner) && (
        <svg width="10" height="10" viewBox="0 0 10 10" style={{ flexShrink: 0 }}>
          <polyline
            points="2,5 4,7.5 8,2.5"
            stroke={isPicked ? '#3b82f6' : '#22c55e'}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

// ââ Series Card âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
export default function SeriesCard({
  series,
  pick,
  oddsMap,
  showOdds,
  onPickClick,
}: SeriesCardProps) {
  const [hover, setHover] = useState(false);
  const { team_a, team_b, winner, locked } = series;

  const hasBothTeams = !!(team_a && team_b);
  const isComplete = !!winner;
  const canPick = !locked && hasBothTeams;
  const pickedId = pick?.picked_team_id;

  const topWon   = isComplete && winner?.id === team_a?.id;
  const botWon   = isComplete && winner?.id === team_b?.id;
  const topPicked = pickedId === team_a?.id;
  const botPicked = pickedId === team_b?.id;
  const hasPick  = !!pick;

  // Score badge label
  const scoreLabel = (() => {
    if (!hasBothTeams) return 'TBD';
    if ((series as any).wins_a != null) return `${(series as any).wins_a}â${(series as any).wins_b}`;
    if (pick?.games_prediction) return `in ${pick.games_prediction}`;
    return 'Â·';
  })();

  return (
    <div
      onClick={() => canPick && onPickClick(series)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 176,
        height: CARD_H,
        background: 'var(--bg-card)',
        border: `1px solid ${
          isComplete ? 'rgba(34,197,94,0.18)'
          : hasPick   ? 'rgba(59,130,246,0.28)'
          : hover && canPick ? 'rgba(255,255,255,0.12)'
          : 'var(--border)'
        }`,
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        position: 'relative',
        cursor: canPick ? 'pointer' : 'default',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: isComplete
          ? '0 0 0 1px rgba(34,197,94,0.06), 0 4px 24px rgba(0,0,0,0.4)'
          : hasPick
          ? '0 0 0 1px rgba(59,130,246,0.06), 0 4px 20px rgba(0,0,0,0.4)'
          : '0 2px 12px rgba(0,0,0,0.3)',
        flexShrink: 0,
      }}
    >
      {/* Top team */}
      <TeamRow
        team={team_a}
        isWinner={topWon}
        isLoser={botWon}
        isPicked={topPicked}
        showOdds={showOdds}
        oddsMap={oddsMap}
      />

      {/* Divider with score / status badge */}
      <div style={{
        height: 1,
        background: isComplete
          ? 'rgba(34,197,94,0.12)'
          : hasPick ? 'rgba(59,130,246,0.12)'
          : 'var(--border)',
        margin: '0 11px',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: isComplete ? '#22c55e' : hasPick ? '#3b82f6' : '#1c1c26',
          border: `1px solid ${isComplete || hasPick ? 'transparent' : 'rgba(255,255,255,0.10)'}`,
          borderRadius: 20,
          padding: '1px 7px',
          fontSize: 10,
          fontWeight: 600,
          color: isComplete || hasPick ? '#fff' : 'rgba(255,255,255,0.4)',
          letterSpacing: '0.04em',
          fontFamily: 'var(--mono)',
          whiteSpace: 'nowrap',
          zIndex: 1,
        }}>
          {scoreLabel}
        </div>
      </div>

      {/* Bottom team */}
      <TeamRow
        team={team_b}
        isWinner={botWon}
        isLoser={topWon}
        isPicked={botPicked}
        showOdds={showOdds}
        oddsMap={oddsMap}
      />
    </div>
  );
}
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
