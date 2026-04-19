"use client";

import { useState, useTransition } from "react";
import { lockPick } from "@/app/(pool)/actions";
import type { Series } from "@/lib/types";

interface PickModalProps {
  series: Series;
  currentPickTeamId?: string;
  currentGames?: number;
  onClose: () => void;
  onSaved: () => void;
}

export default function PickModal({
  series,
  currentPickTeamId,
  currentGames,
  onClose,
  onSaved,
}: PickModalProps) {
  const [selectedTeam, setSelectedTeam] = useState<string>(currentPickTeamId ?? "");
  const [games, setGames] = useState<number>(currentGames ?? 6);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const teams = [series.team_a, series.team_b].filter(Boolean) as NonNullable<
    Series["team_a"]
  >[];

  function handleSubmit() {
    if (!selectedTeam) {
      setError("Please pick a winner.");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.append("series_id", series.id);
      fd.append("picked_team_id", selectedTeam);
      fd.append("games_prediction", String(games));
      try {
        await lockPick(fd);
        onSaved();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to save pick.");
      }
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
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
          maxWidth: 380,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
          }}
        >
          <h2 style={{ fontWeight: 700, fontSize: "1.1rem" }}>Make Your Pick</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "1.2rem",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        {/* Team selection */}
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.6rem", fontWeight: 600, letterSpacing: "0.05em" }}>
          PICK WINNER
        </p>
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
              }}
            >
              <div style={{ fontSize: "0.75rem", marginBottom: "0.2rem", color: "inherit", opacity: 0.7 }}>
                #{team.seed}
              </div>
              {team.abbreviation}
              <div style={{ fontSize: "0.7rem", marginTop: "0.2rem", opacity: 0.7, fontWeight: 400 }}>
                {team.name}
              </div>
            </button>
          ))}
        </div>

        {/* Games prediction */}
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.6rem", fontWeight: 600, letterSpacing: "0.05em" }}>
          SERIES LENGTH (+1 BONUS)
        </p>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {[4, 5, 6, 7].map((g) => (
            <button
              key={g}
              onClick={() => setGames(g)}
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

        {error && (
          <p style={{ color: "var(--error)", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="btn-accent"
          style={{ width: "100%", padding: "0.75rem" }}
        >
          {isPending ? "Saving…" : "Lock Pick →"}
        </button>
      </div>
    </div>
  );
}
