"use client";

import { useState, useTransition, useEffect } from "react";
import { lockPick } from "@/app/(pool)/actions";
import type { Series, OddsSnapshot } from "@/lib/types";

interface PickModalProps {
  series: Series;
  currentPickTeamId?: string;
  currentGames?: number;
  oddsMap: Map<string, OddsSnapshot>;
  onClose: () => void;
  onSaved: (seriesId: string, pickedTeamId: string, gamesPrediction?: number) => void;
}

const ROUND_POINTS: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 8 };

function americanToProb(odds: number): number {
  if (odds > 0) return 100 / (odds + 100);
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds.toLocaleString()}` : String(odds);
}

export default function PickModal({
  series,
  currentPickTeamId,
  currentGames,
  oddsMap,
  onClose,
  onSaved,
}: PickModalProps) {
  const [selectedTeam, setSelectedTeam] = useState<string>(currentPickTeamId ?? "");
  const [games, setGames] = useState<number | null>(currentGames ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const teams = [series.team_a, series.team_b].filter(Boolean) as NonNullable<Series["team_a"]>[];
  const pts = ROUND_POINTS[series.round] ?? 1;
  const confLabel = series.conference === "Finals"
    ? "NBA Finals"
    : `${series.conference} \u00b7 R${series.round}`;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function handleSubmit() {
    if (!selectedTeam) { setError("Please pick a winner."); return; }
    startTransition(async () => {
      const fd = new FormData();
      fd.append("series_id", series.id);
      fd.append("picked_team_id", selectedTeam);
      if (games !== null) fd.append("games_prediction", String(games));
      try {
        await lockPick(fd);
        onSaved(series.id, selectedTeam, games ?? undefined);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to save pick.");
      }
    });
  }

  const selectedTeamObj = teams.find((t) => t.id === selectedTeam);
  const ACCENT_A = "#3b82f6";
  const ACCENT_B = "#f97316";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "1.5rem",
          width: "100%",
          maxWidth: 620,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {confLabel}
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.3rem", cursor: "pointer", lineHeight: 1, padding: "0.2rem 0.4rem" }}
          >
            &#x2715;
          </button>
        </div>

        {/* Team cards row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "0.75rem", marginBottom: "1.25rem", alignItems: "center" }}>
          {teams.map((team, idx) => {
            const isSelected = selectedTeam === team.id;
            const accentColor = idx === 0 ? ACCENT_A : ACCENT_B;
            const odds = oddsMap.get(team.id);
            const seriesWinPct = odds?.r1_win_prob != null ? Math.round(odds.r1_win_prob * 100) : null;
            const titleOdds = odds?.championship_odds;
            const titleProb = titleOdds != null ? (americanToProb(titleOdds) * 100).toFixed(1) : null;

            return (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team.id)}
                style={{
                  background: isSelected ? "rgba(30,30,40,0.9)" : "var(--bg)",
                  border: `2px solid ${isSelected ? accentColor : "var(--border)"}`,
                  borderRadius: "var(--radius)",
                  padding: 0,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                  overflow: "hidden",
                  boxShadow: isSelected ? `0 0 12px ${accentColor}33` : "none",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Colored accent bar */}
                <div style={{ height: 4, background: accentColor, width: "100%", flexShrink: 0 }} />

                <div style={{ padding: "0.85rem 0.9rem", display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1 }}>
                  {/* Seed + name */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                    <span style={{
                      background: "#111",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      borderRadius: 4,
                      padding: "2px 7px",
                      flexShrink: 0,
                      marginTop: 2,
                    }}>
                      {team.seed}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.25, color: isSelected ? accentColor : "var(--text)" }}>
                      {team.name}
                    </span>
                  </div>

                  {/* Record + series win% */}
                  {(team.record || seriesWinPct != null) && (
                    <p style={{ fontSize: "0.7rem", color: "var(--text-dim)", margin: 0 }}>
                      {[team.record, seriesWinPct != null ? `series win ${seriesWinPct}%` : null].filter(Boolean).join(" \u00b7 ")}
                    </p>
                  )}

                  {/* Stars */}
                  {team.stars && (
                    <div>
                      <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.07em", color: "var(--text-muted)", margin: "0 0 2px" }}>
                        STARS
                      </p>
                      <p style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.35, margin: 0 }}>
                        {team.stars}
                      </p>
                    </div>
                  )}

                  {/* Title odds */}
                  {titleOdds != null && (
                    <div>
                      <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.07em", color: "var(--text-muted)", margin: "0 0 2px" }}>
                        TITLE ODDS
                      </p>
                      <p style={{ fontSize: "0.82rem", fontWeight: 600, color: accentColor, margin: 0 }}>
                        {formatOdds(titleOdds)}{titleProb ? ` (${titleProb}%)` : ""}
                      </p>
                    </div>
                  )}

                  {/* Blurb */}
                  {team.blurb && (
                    <p style={{ fontSize: "0.71rem", color: "var(--text-dim)", lineHeight: 1.45, margin: "0.2rem 0 0", fontStyle: "italic" }}>
                      {team.blurb}
                    </p>
                  )}
                </div>
              </button>
            );
          })}

          {/* VS divider */}
          <div style={{ color: "var(--text-dim)", fontWeight: 800, fontSize: "0.8rem", textAlign: "center" }}>
            VS
          </div>
        </div>

        {/* Series length */}
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: 700, letterSpacing: "0.06em" }}>
          SERIES LENGTH{" "}
          <span style={{ fontWeight: 400, color: "var(--text-dim)" }}>
            (optional &#x2014; +1 bonus if correct)
          </span>
        </p>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
          {[4, 5, 6, 7].map((g) => (
            <button
              key={g}
              onClick={() => setGames(games === g ? null : g)}
              style={{
                flex: 1,
                padding: "0.5rem",
                borderRadius: "var(--radius)",
                border: `2px solid ${games === g ? "var(--accent)" : "var(--border)"}`,
                background: games === g ? "var(--accent-glow)" : "var(--bg)",
                color: games === g ? "var(--accent)" : "var(--text-muted)",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Points */}
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.85rem", textAlign: "center" }}>
          Worth{" "}
          <strong style={{ color: "var(--accent)" }}>
            {pts} pt{pts !== 1 ? "s" : ""}
          </strong>{" "}
          if correct
          {games !== null && <span> &#xB7; +1 bonus for correct series length</span>}
        </p>

        {error && (
          <p style={{ color: "var(--error)", fontSize: "0.875rem", marginBottom: "0.75rem" }}>{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={isPending || !selectedTeam}
          className="btn-accent"
          style={{
            width: "100%",
            padding: "0.75rem",
            opacity: !selectedTeam ? 0.4 : 1,
            cursor: !selectedTeam ? "not-allowed" : "pointer",
          }}
        >
          {isPending
            ? "Saving\u2026"
            : selectedTeamObj
            ? `Lock pick: ${selectedTeamObj.abbreviation} \u2192`
            : "Lock Pick \u2192"}
        </button>
      </div>
    </div>
  );
}
