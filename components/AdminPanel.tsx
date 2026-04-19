"use client";

import { useState } from "react";
import type { Series, Team } from "@/lib/types";

interface AdminPanelProps {
  series: Series[];
  teams: Team[];
}

const ROUND_LABELS: Record<number, string> = {
  1: "First Round",
  2: "Conf Semifinals",
  3: "Conf Finals",
  4: "NBA Finals",
};

export default function AdminPanel({ series, teams }: AdminPanelProps) {
  const [status, setStatus] = useState<Record<string, string>>({});

  const teamMap = new Map(teams.map((t) => [t.id, t]));

  async function handleSetWinner(
    seriesId: string,
    winnerId: string,
    games: number
  ) {
    setStatus((s) => ({ ...s, [seriesId]: "saving…" }));
    const res = await fetch("/api/admin/set-winner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ series_id: seriesId, winner_id: winnerId, games }),
    });
    if (res.ok) {
      setStatus((s) => ({ ...s, [seriesId]: "✓ Saved" }));
    } else {
      setStatus((s) => ({ ...s, [seriesId]: "❌ Error" }));
    }
  }

  async function handleLock(seriesId: string) {
    setStatus((s) => ({ ...s, [seriesId]: "locking…" }));
    const res = await fetch("/api/admin/lock-series", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ series_id: seriesId }),
    });
    if (res.ok) {
      setStatus((s) => ({ ...s, [seriesId]: "🔒 Locked" }));
    } else {
      setStatus((s) => ({ ...s, [seriesId]: "❌ Error" }));
    }
  }

  async function handleRefreshOdds() {
    setStatus((s) => ({ ...s, odds: "refreshing…" }));
    const cronSecret = prompt("Enter CRON_SECRET:");
    if (!cronSecret) return;
    const res = await fetch("/api/cron/odds", {
      headers: { Authorization: `Bearer ${cronSecret}` },
    });
    const data = await res.json();
    setStatus((s) => ({
      ...s,
      odds: res.ok ? `✓ ${data.inserted} odds updated` : `❌ ${data.error}`,
    }));
  }

  const byRound = [1, 2, 3, 4].map((r) => ({
    round: r,
    label: ROUND_LABELS[r],
    series: series.filter((s) => s.round === r),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Odds refresh */}
      <div className="card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div>
            <p style={{ fontWeight: 600 }}>Refresh Odds</p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Manually trigger the ESPN odds cron
            </p>
          </div>
          <button onClick={handleRefreshOdds} className="btn-accent">
            Refresh
          </button>
          {status.odds && (
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {status.odds}
            </span>
          )}
        </div>
      </div>

      {/* Series admin */}
      {byRound.map(({ round, label, series: roundSeries }) => (
        <div key={round}>
          <h2
            style={{
              fontWeight: 700,
              fontSize: "0.85rem",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: "0.75rem",
            }}
          >
            {label}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {roundSeries.map((s) => {
              const teamA = s.team_a_id ? teamMap.get(s.team_a_id) : null;
              const teamB = s.team_b_id ? teamMap.get(s.team_b_id) : null;
              const [winner, setWinner] = useState<string>(s.winner_id ?? "");
              const [games, setGames] = useState<number>(s.games ?? 6);

              return (
                <div key={s.id} className="card">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontWeight: 600, minWidth: 160 }}>
                      {teamA?.abbreviation ?? "TBD"} vs {teamB?.abbreviation ?? "TBD"}
                      {s.locked && " 🔒"}
                    </span>

                    <select
                      value={winner}
                      onChange={(e) => setWinner(e.target.value)}
                      style={{
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        color: "var(--text)",
                        padding: "0.4rem 0.6rem",
                        fontSize: "0.875rem",
                      }}
                    >
                      <option value="">— Winner —</option>
                      {[teamA, teamB].filter(Boolean).map((t) => (
                        <option key={t!.id} value={t!.id}>
                          {t!.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={games}
                      onChange={(e) => setGames(Number(e.target.value))}
                      style={{
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        color: "var(--text)",
                        padding: "0.4rem 0.6rem",
                        fontSize: "0.875rem",
                      }}
                    >
                      {[4, 5, 6, 7].map((g) => (
                        <option key={g} value={g}>
                          in {g}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleSetWinner(s.id, winner, games)}
                      disabled={!winner}
                      className="btn-accent"
                      style={{ padding: "0.4rem 0.9rem", fontSize: "0.85rem" }}
                    >
                      Set Winner
                    </button>

                    <button
                      onClick={() => handleLock(s.id)}
                      className="btn-ghost"
                      style={{ padding: "0.4rem 0.9rem", fontSize: "0.85rem" }}
                    >
                      Lock
                    </button>

                    {status[s.id] && (
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {status[s.id]}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
