"use client";

import { useState, useTransition, useEffect } from "react";
import { lockPick } from "@/app/(pool)/actions";
import type { Series } from "@/lib/types";

interface PickModalProps {
  series: Series;
  currentPickTeamId?: string;
  currentGames?: number;
  onClose: () => void;
  onSaved: (seriesId: string, pickedTeamId: string, gamesPrediction?: number) => void;
}

const ROUND_POINTS: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 8 };

export default function PickModal({ series, currentPickTeamId, currentGames, onClose, onSaved }: PickModalProps) {
  const [selectedTeam, setSelectedTeam] = useState<string>(currentPickTeamId ?? "");
  const [games, setGames] = useState<number | null>(currentGames ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const teams = [series.team_a, series.team_b].filter(Boolean) as NonNullable<Series["team_a"]>[];
  const pts = ROUND_POINTS[series.round] ?? 1;
  const confLabel = series.conference === "Finals" ? "NBA Finals" : `${series.conference} \u00b7 R${series.round}`;

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

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.5rem", width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: "1.1rem", lineHeight: 1.2 }}>Pick the Winner</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{confLabel}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.4rem", cursor: "pointer", lineHeight: 1, padding: "0.2rem 0.4rem" }}>
            \u2715
          </button>
        </div>

        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.6rem", fontWeight: 600, letterSpacing: "0.05em" }}>PICK WINNER</p>
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team.id)}
              style={{
                flex: 1,
                padding: "0.9rem 0.5rem",
                borderRadius: "var(--radius)",
                border: `2px solid ${selectedTeam === team.id ? "var(--accent)" : "var(--border)"}`,
                background: selectedTeam === team.id ? "var(--accent-glow)" : "var(--bg)",
                color: selectedTeam === team.id ? "var(--accent)" : "var(--text)",
                fontWeight: 700,
                fontSize: "0.95rem",
                transition: "all 0.15s",
                cursor: "pointer",
                boxShadow: selectedTeam === team.id ? "0 0 0 1px var(--accent)" : "none",
              }}
            >
              <div style={{ fontSize: "0.72rem", marginBottom: "0.25rem", opacity: 0.7 }}>#{team.seed}</div>
              {team.abbreviation}
              <div style={{ fontSize: "0.68rem", marginTop: "0.25rem", opacity: 0.6, fontWeight: 400 }}>{team.name}</div>
            </button>
          ))}
        </div>

        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.6rem", fontWeight: 600, letterSpacing: "0.05em" }}>
          SERIES LENGTH <span style={{ fontWeight: 400, color: "var(--text-dim)" }}>(optional \u2014 +1 bonus if correct)</span>
        </p>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {[4, 5, 6, 7].map((g) => (
            <button
              key={g}
              onClick={() => setGames(games === g ? null : g)}
              style={{
                flex: 1,
                padding: "0.55rem",
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

        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem", textAlign: "center" }}>
          Worth <strong style={{ color: "var(--accent)" }}>{pts} pt{pts !== 1 ? "s" : ""}</strong> if correct
          {games !== null && <span> \u00b7 +1 bonus for correct series length</span>}
        </p>

        {error && <p style={{ color: "var(--error)", fontSize: "0.875rem", marginBottom: "0.75rem" }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isPending || !selectedTeam}
          className="btn-accent"
          style={{ width: "100%", padding: "0.75rem", opacity: !selectedTeam ? 0.4 : 1, cursor: !selectedTeam ? "not-allowed" : "pointer" }}
        >
          {isPending ? "Saving\u2026" : selectedTeamObj ? `Lock pick: ${selectedTeamObj.abbreviation} \u2192` : "Lock Pick \u2192"}
        </button>
      </div>
    </div>
  );
}
