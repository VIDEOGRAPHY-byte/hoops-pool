"use client";

import { useState, useCallback } from "react";
import type { Series, Pick, Team, OddsSnapshot } from "@/lib/types";
import { groupSeriesByRound } from "@/lib/bracket";
import SeriesCard from "./SeriesCard";
import PickModal from "./PickModal";
import OddsAssistToggle from "./OddsAssistToggle";
import Toast from "./Toast";

interface BracketProps {
  series: Series[];
  picks: Pick[];
  teams: Team[];
  participantId: string;
}

export default function Bracket({ series, picks }: BracketProps) {
  const [showOdds, setShowOdds] = useState(false);
  const [activeSeries, setActiveSeries] = useState<Series | null>(null);
  const [localPicks, setLocalPicks] = useState<Pick[]>(picks);
  const [toast, setToast] = useState<string | null>(null);

  const oddsMap = new Map<string, OddsSnapshot>();
  const pickMap = new Map(localPicks.map((p) => [p.series_id, p]));
  const groups = groupSeriesByRound(series);

  const totalPickable = 15;
  const picksMade = localPicks.length;
  const progressPct = (picksMade / totalPickable) * 100;

  const handlePickClick = useCallback((s: Series) => {
    setActiveSeries(s);
  }, []);

  const handleSaved = useCallback((seriesId: string, pickedTeamId: string, gamesPrediction?: number) => {
    setLocalPicks((prev) => {
      const existing = prev.findIndex((p) => p.series_id === seriesId);
      const newPick: Pick = {
        id: `local-${seriesId}`,
        participant_id: "",
        series_id: seriesId,
        picked_team_id: pickedTeamId,
        games_prediction: gamesPrediction ?? null,
        locked: false,
        created_at: new Date().toISOString(),
      };
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newPick;
        return updated;
      }
      return [...prev, newPick];
    });
    setActiveSeries(null);
    setToast("Pick saved! \u2713");
  }, []);

  function renderColumn(groupSeries: Series[]) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", justifyContent: "space-around" }}>
        {groupSeries.map((s) => (
          <SeriesCard
            key={s.id}
            series={s}
            pick={pickMap.get(s.id)}
            oddsMap={oddsMap}
            showOdds={showOdds}
            onPickClick={handlePickClick}
          />
        ))}
        {groupSeries.length === 0 && (
          <div
            style={{
              minWidth: 130,
              maxWidth: 160,
              height: 80,
              background: "var(--bg-card)",
              border: "1px dashed var(--border)",
              borderRadius: "var(--radius)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-dim)",
              fontSize: "0.78rem",
            }}
          >
            TBD
          </div>
        )}
      </div>
    );
  }

  const finalsGroup = groups.find((g) => g.round === 4);

  return (
    <div>
      {/* Controls row */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <OddsAssistToggle enabled={showOdds} onToggle={setShowOdds} />
        <span
          style={{
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "0.3rem 0.7rem",
          }}
        >
          Click any matchup to pick \u00b7 picks lock on submit
        </span>
        <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
            {picksMade} / 15 picks
          </span>
          <div style={{ width: 120, height: 5, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
            <div
              style={{
                width: `${progressPct.toFixed(1)}%`,
                height: "100%",
                background: "var(--accent)",
                borderRadius: 999,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* Bracket grid */}
      <div className="no-scrollbar" style={{ overflowX: "auto", paddingBottom: "1rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(155px, 1fr))",
            gap: "1rem",
            minWidth: 1100,
          }}
        >
          {["R1 \u00b7 West", "Conf Semis", "Conf Finals", "NBA Finals", "Conf Finals", "Conf Semis", "R1 \u00b7 East"].map(
            (label, i) => (
              <div
                key={i}
                style={{
                  textAlign: "center",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  paddingBottom: "0.5rem",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {label}
              </div>
            )
          )}

          {renderColumn(series.filter((s) => s.round === 1 && s.conference === "West"))}
          {renderColumn(series.filter((s) => s.round === 2 && s.conference === "West"))}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {renderColumn(series.filter((s) => s.round === 3 && s.conference === "West"))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.5rem" }}>\u{1F3C6}</span>
            {finalsGroup?.finals ? (
              <SeriesCard
                series={finalsGroup.finals}
                pick={pickMap.get(finalsGroup.finals.id)}
                oddsMap={oddsMap}
                showOdds={showOdds}
                onPickClick={handlePickClick}
              />
            ) : (
              <div
                style={{
                  minWidth: 130,
                  maxWidth: 160,
                  height: 80,
                  background: "var(--bg-card)",
                  border: "1px dashed var(--accent)",
                  borderRadius: "var(--radius)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                }}
              >
                NBA Finals
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {renderColumn(series.filter((s) => s.round === 3 && s.conference === "East"))}
          </div>
          {renderColumn(series.filter((s) => s.round === 2 && s.conference === "East"))}
          {renderColumn(series.filter((s) => s.round === 1 && s.conference === "East"))}
        </div>
      </div>

      {activeSeries && (
        <PickModal
          series={activeSeries}
          currentPickTeamId={pickMap.get(activeSeries.id)?.picked_team_id}
          currentGames={pickMap.get(activeSeries.id)?.games_prediction ?? undefined}
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
