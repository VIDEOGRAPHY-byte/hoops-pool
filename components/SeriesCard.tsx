"use client";

import { useState } from "react";
import type { Series, Pick, OddsSnapshot } from "@/lib/types";

// Card dimensions â match design constants
export const CARD_H = 96;   // total height per matchup (2 Ã 48 px team rows)
const TEAM_H = CARD_H / 2;  // 48 px per team row

export interface Picker { name: string; isYou: boolean; }

interface SeriesCardProps {
  series: Series;
  pick: Pick | undefined;
  oddsMap: Map<string, OddsSnapshot>;
  showOdds: boolean;
  onPickClick: (series: Series) => void;
  communityPicks?: Array<{ name: string; teamId: string; isYou: boolean }>;
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

// ââ Picker Strip ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function PickerStrip({ pickers }: { pickers: Picker[] }) {
  if (pickers.length === 0) return null;
  const visible = pickers.slice(0, 4);
  const overflow = pickers.length - visible.length;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
      {visible.map((p, i) => (
        <div key={i} title={p.name} style={{
          width: 15, height: 15, borderRadius: '50%',
          background: p.isYou ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${p.isYou ? 'rgba(59,130,246,0.55)' : 'rgba(255,255,255,0.14)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 6.5, fontWeight: 700,
          color: p.isYou ? '#3b82f6' : 'rgba(255,255,255,0.45)',
          letterSpacing: '-0.02em', fontFamily: 'var(--mono)', flexShrink: 0,
        }}>
          {p.name.substring(0, 2).toUpperCase()}
        </div>
      ))}
      {overflow > 0 && (
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--mono)', flexShrink: 0 }}>
          +{overflow}
        </span>
      )}
    </div>
  );
}

// ââ Team Row âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function TeamRow({
  team,
  isWinner,
  isLoser,
  isPicked,
  showOdds,
  oddsMap,
  pickers,
}: {
  team: NonNullable<Series['team_a']> | undefined;
  isWinner: boolean;
  isLoser: boolean;
  isPicked: boolean;
  showOdds: boolean;
  oddsMap: Map<string, OddsSnapshot>;
  pickers: Picker[];
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
        padding: '0 8px 0 11px',
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

      {/* Picker initials */}
      <PickerStrip pickers={pickers} />

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
  communityPicks = [],
}: SeriesCardProps) {
  const [hover, setHover] = useState(false);
  const { team_a, team_b, winner, locked } = series;

  const hasBothTeams = !!(team_a && team_b);
  const isComplete = !!winner;
  const canPick = hasBothTeams;
  const pickedId = pick?.picked_team_id;

  const topWon   = isComplete && winner?.id === team_a?.id;
  const botWon   = isComplete && winner?.id === team_b?.id;
  const topPicked = pickedId === team_a?.id;
  const botPicked = pickedId === team_b?.id;
  const hasPick  = !!pick;

  const topPickers = communityPicks.filter((cp) => cp.teamId === team_a?.id);
  const botPickers = communityPicks.filter((cp) => cp.teamId === team_b?.id);

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
        pickers={topPickers}
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
        pickers={botPickers}
      />
    </div>
  );
}
