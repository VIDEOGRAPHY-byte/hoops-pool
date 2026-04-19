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
  const [toast, setToast] = useState<string | null>(null);

  // Odds map — in real use, would come from a server fetch;
  // for now we pass an empty map (populated after first cron run)
  const oddsMap = new Map<string, OddsSnapshot>();

  const pickMap = new Map(picks.map((p) => [p.series_id, p]));
  const groups = groupSeriesByRound(series);

  const handlePickClick = useCallback((s: Series) => {
    setActiveSeries(s);
  }, []);

  const handleSaved = useCallback(() => {
    setActiveSeries(null);
    setToast("Pick saved! ✓");
  }, []);

  function renderGroup(
    groupSeries: Series[],
    conf: "East" | "West"
  ) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
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

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <OddsAssistToggle enabled={showOdds} onToggle={setShowOdds} />
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", alignSelf: "center" }}>
          Tap a series to make or update your pick
        </span>
      </div>

      {/* Bracket layout */}
      <div
        className="no-scrollbar"
        style={{
          overflowX: "auto",
          paddingBottom: "1rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(155px, 1fr))",
            gap: "1rem",
            minWidth: 1100,
          }}
        >
          {/* Column headers */}
          {["R1", "Conf Semis", "Conf Finals", "NBA Finals", "Conf Finals", "Conf Semis", "R1"].map(
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

          {/* East R1 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", justifyContent: "space-around" }}>
            {renderGroup(
              series.filter((s) => s.round === 1 && s.conference === "East"),
              "East"
            )}
          </div>

          {/* East R2 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", justifyContent: "space-around" }}>
            {renderGroup(
              series.filter((s) => s.round === 2 && s.conference === "East"),
              "East"
            )}
          </div>

          {/* East CF */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {renderGroup(
              series.filter((s) => s.round === 3 && s.conference === "East"),
              "East"
            )}
          </div>

          {/* Finals */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            {groups.find((g) => g.round === 4)?.finals ? (
              <SeriesCard
                series={groups.find((g) => g.round === 4)!.finals!}
                pick={pickMap.get(groups.find((g) => g.round === 4)!.finals!.id)}
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
                🏆 Finals
              </div>
            )}
          </div>

          {/* West CF */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {renderGroup(
              series.filter((s) => s.round === 3 && s.conference === "West"),
              "West"
            )}
          </div>

          {/* West R2 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", justifyContent: "space-around" }}>
            {renderGroup(
              series.filter((s) => s.round === 2 && s.conference === "West"),
              "West"
            )}
          </div>

          {/* West R1 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", justifyContent: "space-around" }}>
            {renderGroup(
              series.filter((s) => s.round === 1 && s.conference === "West"),
              "West"
            )}
          </div>
        </div>
      </div>

      {/* Pick modal */}
      {activeSeries && (
        <PickModal
          series={activeSeries}
          currentPickTeamId={pickMap.get(activeSeries.id)?.picked_team_id}
          currentGames={pickMap.get(activeSeries.id)?.games_prediction ?? undefined}
          onClose={() => setActiveSeries(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast}
          type="success"
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
