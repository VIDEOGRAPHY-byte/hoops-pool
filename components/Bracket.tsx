"use client";

import { useState, useCallback, useMemo } from "react";
import type { Series, Pick, Team, OddsSnapshot, CommunityPick } from "@/lib/types";
import SeriesCard, { CARD_H } from "./SeriesCard";
import PickModal from "./PickModal";
import OddsAssistToggle from "./OddsAssistToggle";
import Toast from "./Toast";

// ââ Layout constants (from design) ââââââââââââââââââââââââââââââââââââââââââ
const INNER_GAP = 8;   // gap between matchups within a pair
const OUTER_GAP = 48;  // gap between the two pairs per conference
const COL_H = 4 * CARD_H + 2 * INNER_GAP + OUTER_GAP; // 448
const CONN_W = 28;     // SVG connector column width

const R1_TOPS  = [
  0,
  CARD_H + INNER_GAP,
  2 * CARD_H + INNER_GAP + OUTER_GAP,
  3 * CARD_H + 2 * INNER_GAP + OUTER_GAP,
];
const R1_CENTS = R1_TOPS.map((t) => t + CARD_H / 2);
const PAIR_MIDS = [
  (R1_CENTS[0] + R1_CENTS[1]) / 2,
  (R1_CENTS[2] + R1_CENTS[3]) / 2,
];
const R2_PAD    = PAIR_MIDS[0] - CARD_H / 2;
const R2_GAP    = PAIR_MIDS[1] - PAIR_MIDS[0] - CARD_H;
const CF_CENTER = COL_H / 2;
const CF_PAD    = CF_CENTER - CARD_H / 2;

// ââ Bracket dependency tree ââââââââââââââââââââââââââââââââââââââââââââââââââ
const BRACKET_TREE: Record<string, [string, string]> = {
  "e1000000-0000-0000-0000-000000000001": [
    "d1000000-0000-0000-0000-000000000001",
    "d4000000-0000-0000-0000-000000000004",
  ],
  "e2000000-0000-0000-0000-000000000002": [
    "d2000000-0000-0000-0000-000000000002",
    "d3000000-0000-0000-0000-000000000003",
  ],
  "e3000000-0000-0000-0000-000000000003": [
    "d5000000-0000-0000-0000-000000000005",
    "d8000000-0000-0000-0000-000000000008",
  ],
  "e4000000-0000-0000-0000-000000000004": [
    "d6000000-0000-0000-0000-000000000006",
    "d7000000-0000-0000-0000-000000000007",
  ],
  "f1000000-0000-0000-0000-000000000001": [
    "e1000000-0000-0000-0000-000000000001",
    "e2000000-0000-0000-0000-000000000002",
  ],
  "f2000000-0000-0000-0000-000000000002": [
    "e3000000-0000-0000-0000-000000000003",
    "e4000000-0000-0000-0000-000000000004",
  ],
  "f3000000-0000-0000-0000-000000000003": [
    "f1000000-0000-0000-0000-000000000001",
    "f2000000-0000-0000-0000-000000000002",
  ],
};

// ââ SVG Connectors âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const CONN_GRAY = 'rgba(255,255,255,0.10)';
const CONN_BLUE = 'rgba(59,130,246,0.35)';

function ConnR1toR2({ dir, r1HasPick }: { dir: 'ltr' | 'rtl'; r1HasPick: boolean[] }) {
  const mid   = CONN_W / 2;
  const fromX = dir === 'ltr' ? 0 : CONN_W;
  const toX   = dir === 'ltr' ? CONN_W : 0;

  return (
    <svg width={CONN_W} height={COL_H} style={{ display: 'block', flexShrink: 0, alignSelf: 'flex-start' }}>
      {([0, 1] as const).map((pi) => {
        const c0 = R1_CENTS[pi * 2];
        const c1 = R1_CENTS[pi * 2 + 1];
        const pm = PAIR_MIDS[pi];
        const col0 = r1HasPick[pi * 2]     ? CONN_BLUE : CONN_GRAY;
        const col1 = r1HasPick[pi * 2 + 1] ? CONN_BLUE : CONN_GRAY;
        const colPair = (r1HasPick[pi * 2] && r1HasPick[pi * 2 + 1]) ? CONN_BLUE : CONN_GRAY;
        return (
          <g key={pi}>
            <line x1={fromX} y1={c0} x2={mid}  y2={c0} stroke={col0}    strokeWidth={1} />
            <line x1={fromX} y1={c1} x2={mid}  y2={c1} stroke={col1}    strokeWidth={1} />
            <line x1={mid}   y1={c0} x2={mid}  y2={c1} stroke={CONN_GRAY} strokeWidth={1} />
            <line x1={mid}   y1={pm} x2={toX}  y2={pm} stroke={colPair} strokeWidth={1} />
            <circle cx={mid} cy={pm} r={2} fill={colPair} />
          </g>
        );
      })}
    </svg>
  );
}

function ConnR2toCF({ dir, r2HasPick }: { dir: 'ltr' | 'rtl'; r2HasPick: boolean[] }) {
  const mid   = CONN_W / 2;
  const fromX = dir === 'ltr' ? 0 : CONN_W;
  const toX   = dir === 'ltr' ? CONN_W : 0;
  const r2c0  = R2_PAD + CARD_H / 2;
  const r2c1  = R2_PAD + CARD_H + R2_GAP + CARD_H / 2;
  const both  = r2HasPick[0] && r2HasPick[1];

  return (
    <svg width={CONN_W} height={COL_H} style={{ display: 'block', flexShrink: 0, alignSelf: 'flex-start' }}>
      <line x1={fromX} y1={r2c0}      x2={mid}  y2={r2c0}      stroke={r2HasPick[0] ? CONN_BLUE : CONN_GRAY} strokeWidth={1} />
      <line x1={fromX} y1={r2c1}      x2={mid}  y2={r2c1}      stroke={r2HasPick[1] ? CONN_BLUE : CONN_GRAY} strokeWidth={1} />
      <line x1={mid}   y1={r2c0}      x2={mid}  y2={r2c1}      stroke={CONN_GRAY} strokeWidth={1} />
      <line x1={mid}   y1={CF_CENTER} x2={toX}  y2={CF_CENTER} stroke={both ? CONN_BLUE : CONN_GRAY} strokeWidth={1} />
      <circle cx={mid} cy={CF_CENTER} r={2} fill={both ? CONN_BLUE : CONN_GRAY} />
    </svg>
  );
}

function ConnCFtoFinals({ cfHasPick }: { cfHasPick: boolean }) {
  const color = cfHasPick ? CONN_BLUE : CONN_GRAY;
  return (
    <svg width={CONN_W} height={COL_H} style={{ display: 'block', flexShrink: 0, alignSelf: 'flex-start' }}>
      <line x1={0} y1={CF_CENTER} x2={CONN_W} y2={CF_CENTER} stroke={color} strokeWidth={1} />
    </svg>
  );
}

// ââ Round label ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function RoundLabel({ label }: { label: string }) {
  return (
    <div style={{
      textAlign: 'center', marginBottom: 10,
      fontSize: 9.5, fontWeight: 600, letterSpacing: '0.10em',
      textTransform: 'uppercase', color: 'var(--text-3)',
    }}>
      {label}
    </div>
  );
}

// ââ BracketProps âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
interface BracketProps {
  series: Series[];
  picks: Pick[];
  teams: Team[];
  oddsSnapshots: OddsSnapshot[];
  participantId: string;
  communityPicks: CommunityPick[];
}

export default function Bracket({ series, picks, teams, oddsSnapshots, participantId, communityPicks }: BracketProps) {
  const [showOdds, setShowOdds]         = useState(false);
  const [activeSeries, setActiveSeries] = useState<Series | null>(null);
  const [localPicks, setLocalPicks]     = useState<Pick[]>(picks);
  const [toast, setToast]               = useState<string | null>(null);

  const oddsMap = useMemo(
    () => new Map<string, OddsSnapshot>(oddsSnapshots.map((o) => [o.team_id, o])),
    [oddsSnapshots]
  );
  const teamsById = useMemo(
    () => new Map<string, Team>(teams.map((t) => [t.id, t])),
    [teams]
  );
  const pickMap = useMemo(
    () => new Map<string, Pick>(localPicks.map((p) => [p.series_id, p])),
    [localPicks]
  );

  const getEffectiveSeries = useCallback(
    (s: Series): Series => {
      if (s.team_a && s.team_b) return s;
      const feeders = BRACKET_TREE[s.id];
      if (!feeders) return s;
      const [fa, fb] = feeders;
      const teamA = pickMap.get(fa) ? teamsById.get(pickMap.get(fa)!.picked_team_id) : undefined;
      const teamB = pickMap.get(fb) ? teamsById.get(pickMap.get(fb)!.picked_team_id) : undefined;
      return { ...s, team_a: teamA ?? undefined, team_b: teamB ?? undefined };
    },
    [pickMap, teamsById]
  );

  const effectiveMap = useMemo(() => {
    const m = new Map<string, Series>();
    for (const s of series) m.set(s.id, getEffectiveSeries(s));
    return m;
  }, [series, getEffectiveSeries]);

  const picksMade   = localPicks.length;
  const progressPct = (picksMade / 15) * 100;

  const handlePickClick = useCallback((s: Series) => setActiveSeries(s), []);

  const handleSaved = useCallback(
    (seriesId: string, pickedTeamId: string, gamesPrediction?: number) => {
      setLocalPicks((prev) => {
        const idx = prev.findIndex((p) => p.series_id === seriesId);
        const newPick: Pick = {
          id: `local-${seriesId}`,
          participant_id: '',
          series_id: seriesId,
          picked_team_id: pickedTeamId,
          games_prediction: gamesPrediction ?? null,
          locked: false,
          created_at: new Date().toISOString(),
        };
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = newPick;
          return updated;
        }
        return [...prev, newPick];
      });
      setActiveSeries(null);
      setToast('Pick saved! \u2713');
    },
    []
  );

  // ââ Column helpers âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  function cardEl(id: string) {
    const eff = effectiveMap.get(id) ?? series.find((s) => s.id === id)!;
    if (!eff) return null;
    const seriesCommunityPicks = communityPicks
      .filter((cp) => cp.seriesId === id)
      .map((cp) => ({
        name: cp.participantName,
        teamId: cp.pickedTeamId,
        isYou: cp.participantId === participantId,
      }));
    return (
      <SeriesCard
        key={id}
        series={eff}
        pick={pickMap.get(id)}
        oddsMap={oddsMap}
        showOdds={showOdds}
        onPickClick={handlePickClick}
        communityPicks={seriesCommunityPicks}
      />
    );
  }

  function hasPich(id: string) { return pickMap.has(id); }

  function R1Col({ ids }: { ids: string[] }) {
    return (
      <div style={{ position: 'relative', width: 176, height: COL_H, flexShrink: 0 }}>
        {ids.map((id, i) => (
          <div key={id} style={{ position: 'absolute', top: R1_TOPS[i], left: 0 }}>
            {cardEl(id)}
          </div>
        ))}
      </div>
    );
  }

  function R2Col({ ids }: { ids: string[] }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: COL_H, flexShrink: 0, paddingTop: R2_PAD, gap: R2_GAP }}>
        {ids.map((id) => cardEl(id))}
      </div>
    );
  }

  function CFCol({ id }: { id: string }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: COL_H, flexShrink: 0, paddingTop: CF_PAD }}>
        {cardEl(id)}
      </div>
    );
  }

  // ââ Series IDs by conference / round âââââââââââââââââââââââââââââââââââââââ
  const westR1  = series.filter((s) => s.round === 1 && s.conference === 'West').map((s) => s.id);
  const westR2  = series.filter((s) => s.round === 2 && s.conference === 'West').map((s) => s.id);
  const westCFId = series.find((s) => s.round === 3 && s.conference === 'West')?.id ?? '';
  const eastR1  = series.filter((s) => s.round === 1 && s.conference === 'East').map((s) => s.id);
  const eastR2  = series.filter((s) => s.round === 2 && s.conference === 'East').map((s) => s.id);
  const eastCFId = series.find((s) => s.round === 3 && s.conference === 'East')?.id ?? '';
  const finalsId = series.find((s) => s.round === 4)?.id ?? '';
  const finalsSeries = finalsId
    ? (effectiveMap.get(finalsId) ?? series.find((s) => s.id === finalsId))
    : undefined;
  const champion = finalsSeries?.winner;

  const connTop = 30; // top offset to align connector SVGs with card midpoints

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <OddsAssistToggle enabled={showOdds} onToggle={setShowOdds} />

        <span style={{
          fontSize: '0.8rem', color: 'var(--text-muted)',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '0.3rem 0.7rem',
        }}>
          Click any matchup to pick &middot; picks lock at tipoff
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {picksMade} / 15 picks
          </span>
          <div style={{ width: 120, height: 5, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              width: `${progressPct.toFixed(1)}%`, height: '100%',
              background: progressPct >= 100 ? '#22c55e' : 'var(--accent)',
              borderRadius: 999, transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Bracket canvas */}
      <div className="no-scrollbar" style={{ overflowX: 'auto', paddingBottom: '1.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 0, minWidth: 'max-content', padding: '0 4px' }}>

          {/* West R1 */}
          <div><RoundLabel label="R1 Â· West" /><R1Col ids={westR1} /></div>

          {/* West R1âR2 connector */}
          <div style={{ paddingTop: connTop }}>
            <ConnR1toR2 dir="ltr" r1HasPick={westR1.map(hasPick)} />
          </div>

          {/* West R2 */}
          <div><RoundLabel label="Conf Semis" /><R2Col ids={westR2} /></div>

          {/* West R2âCF connector */}
          <div style={{ paddingTop: connTop }}>
            <ConnR2toCF dir="ltr" r2HasPick={westR2.map(hasPick)} />
          </div>

          {/* West CF */}
          <div><RoundLabel label="Conf Finals" /><CFCol id={westCFId} /></div>

          {/* West CFâFinals connector */}
          <div style={{ paddingTop: connTop }}>
            <ConnCFtoFinals cfHasPick={hasPick(westCFId)} />
          </div>

          {/* Finals */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              fontSize: 9.5, fontWeight: 600, letterSpacing: '0.10em',
              textTransform: 'uppercase', color: 'var(--text-3)',
              marginBottom: 10, textAlign: 'center',
            }}>
              NBA Finals
            </div>
            <div style={{ height: COL_H, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
              {champion && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(234,179,8,0.08)',
                  border: '1px solid rgba(234,179,8,0.20)',
                  borderRadius: 20, padding: '4px 12px',
                  fontSize: 11, fontWeight: 600,
                  color: 'rgba(234,179,8,0.9)', letterSpacing: '0.06em',
                }}>
                  <span>ð</span><span>{champion.name}</span>
                </div>
              )}
              {finalsSeries ? (
                cardEl(finalsId)
              ) : (
                <div style={{
                  width: 176, height: CARD_H,
                  background: 'var(--bg-card)',
                  border: '1px dashed rgba(59,130,246,0.30)',
                  borderRadius: 'var(--radius)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--blue)', fontSize: '0.78rem', fontWeight: 600,
                }}>
                  NBA Finals
                </div>
              )}
            </div>
          </div>

          {/* East CFâFinals connector */}
          <div style={{ paddingTop: connTop }}>
            <ConnCFtoFinals cfHasPick={hasPick(eastCFId)} />
          </div>

          {/* East CF */}
          <div><RoundLabel label="Conf Finals" /><CFCol id={eastCFId} /></div>

          {/* East R2âCF connector */}
          <div style={{ paddingTop: connTop }}>
            <ConnR2toCF dir="rtl" r2HasPick={eastR2.map(hasPick)} />
          </div>

          {/* East R2 */}
          <div><RoundLabel label="Conf Semis" /><R2Col ids={eastR2} /></div>

          {/* East R1âR2 connector */}
          <div style={{ paddingTop: connTop }}>
            <ConnR1toR2 dir="rtl" r1HasPick={eastR1.map(hasPick)} />
          </div>

          {/* East R1 */}
          <div><RoundLabel label="R1 Â· East" /><R1Col ids={eastR1} /></div>

        </div>
      </div>

      {activeSeries && (
        <PickModal
          series={activeSeries}
          currentPickTeamId={pickMap.get(activeSeries.id)?.picked_team_id}
          currentGames={pickMap.get(activeSeries.id)?.games_prediction ?? undefined}
          oddsMap={oddsMap}
          onClose={() => setActiveSeries(null)}
          onSaved={handleSaved}
        />
      )}

      {toast && (
        <Toast message={toast} type="success" onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
