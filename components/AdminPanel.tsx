"use client";

import { useState } from "react";
import type { Series, Team } from "@/lib/types";

interface AdminPanelProps {
  series: Series[];
  teams: Team[];
  poolLocked?: boolean;
}

const ROUND_LABELS: Record<number, string> = {
  1: "First Round",
  2: "Conf Semifinals",
  3: "Conf Finals",
  4: "NBA Finals",
};

export default function AdminPanel({ series, teams, poolLocked = false }: AdminPanelProps) {
  const [status, setStatus] = useState<Record<string, string>>({});
  const [isPoolLocked, setIsPoolLocked] = useState(poolLocked);

  async function handleTogglePoolLock() {
    const action = isPoolLocked ? "unlock" : "lock";
    if (!confirm(`${action === "lock" ? "Lock" : "Unlock"} all bracket submissions? ${action === "lock" ? "No user will be able to make changes." : "Users will be able to edit picks again."}`)) return;
    setStatus((s) => ({ ...s, poolLock: "saving\u2026" }));
    const res = await fetch("/api/admin/lock-pool", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locked: !isPoolLocked }),
    });
    if (res.ok) {
      setIsPoolLocked(!isPoolLocked);
      setStatus((s) => ({ ...s, poolLock: !isPoolLocked ? "\uD83D\uDD12 Brackets locked" : "\uD83D\uDD13 Brackets unlocked" }));
    } else {
      setStatus((s) => ({ ...s, poolLock: "\u274C Error \u2014 are you signed in as admin?" }));
    }
  }

  const teamMap = new Map(teams.map((t) => [t.id, t]));

  async function handleSetWinner(seriesId: string, winnerId: string, games: number) {
    setStatus((s) => ({ ...s, [seriesId]: "saving\u2026" }));
    const res = await fetch("/api/admin/set-winner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ series_id: seriesId, winner_id: winnerId, games }),
    });
    setStatus((s) => ({ ...s, [seriesId]: res.ok ? "\u2713 Saved" : "\u274C Error" }));
  }

  async function handleClearWinner(seriesId: string) {
    if (!confirm("Clear winner and unlock this series?")) return;
    setStatus((s) => ({ ...s, [seriesId]: "clearing\u2026" }));
    const res = await fetch("/api/admin/clear-winner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ series_id: seriesId }),
    });
    setStatus((s) => ({ ...s, [seriesId]: res.ok ? "\u2713 Cleared \u2014 reload to see" : "\u274C Error" }));
  }

  async function handleLock(seriesId: string) {
    setStatus((s) => ({ ...s, [seriesId]: "locking\u2026" }));
    const res = await fetch("/api/admin/lock-series", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ series_id: seriesId }),
    });
    setStatus((s) => ({ ...s, [seriesId]: res.ok ? "\uD83D\uDD12 Locked" : "\u274C Error" }));
  }

  async function handleRefreshOdds() {
    setStatus((s) => ({ ...s, odds: "refreshing\u2026" }));
    const cronSecret = prompt("Enter CRON_SECRET:");
    if (!cronSecret) return;
    const res = await fetch("/api/cron/odds", {
      headers: { Authorization: `Bearer ${cronSecret}` },
    });
    const data = await res.json();
    setStatus((s) => ({
      ...s,
      odds: res.ok ? `\u2713 ${data.inserted} odds updated` : `\u274C ${data.error}`,
    }));
  }

  const byRound = [1, 2, 3, 4].map((r) => ({
    round: r,
    label: ROUND_LABELS[r],
    series: series.filter((s) => s.round === r),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <p style={{ fontWeight: 600 }}>Refresh Odds</p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Manually trigger the ESPN odds cron</p>
          </div>
          <button onClick={handleRefreshOdds} className="btn-accent">Refresh</button>
          {status.odds && <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{status.odds}</span>}
        </div>
      </div>

      <div className="card" style={{ border: isPoolLocked ? "1px solid rgba(239,68,68,0.3)" : undefined }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <p style={{ fontWeight: 600 }}>{isPoolLocked ? "\uD83D\uDD12 Brackets Locked" : "\uD83D\uDD13 Brackets Open"}</p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {isPoolLocked ? "No users can submit or change picks" : "Users can still edit their picks"}
            </p>
          </div>
          <button
            onClick={handleTogglePoolLock}
            className="btn-accent"
            style={isPoolLocked ? { background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" } : {}}
          >
            {isPoolLocked ? "Unlock Brackets" : "Lock All Brackets"}
          </button>
          {status.poolLock && <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{status.poolLock}</span>}
        </div>
      </div>

      {byRound.map(({ round, label, series: roundSeries }) => (
        <div key={round}>
          <h2 style={{ fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
            {label}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {roundSeries.map((s) => (
              <SeriesRow
                key={s.id}
                s={s}
                teamMap={teamMap}
                status={status[s.id]}
                onSetWinner={handleSetWinner}
                onLock={handleLock}
                onClearWinner={handleClearWinner}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SeriesRow({
  s, teamMap, status, onSetWinner, onLock, onClearWinner,
}: {
  s: Series;
  teamMap: Map<string, Team>;
  status: string | undefined;
  onSetWinner: (id: string, winnerId: string, games: number) => void;
  onLock: (id: string) => void;
  onClearWinner: (id: string) => void;
}) {
  const teamA = s.team_a_id ? teamMap.get(s.team_a_id) : null;
  const teamB = s.team_b_id ? teamMap.get(s.team_b_id) : null;
  const [winner, setWinner] = useState<string>(s.winner_id ?? "");
  const [games, setGames] = useState<number>(s.games ?? 6);

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <span style={{ fontWeight: 600, minWidth: 160 }}>
          {teamA?.abbreviation ?? "TBD"} vs {teamB?.abbreviation ?? "TBD"}{s.locked && " \uD83D\uDD12"}
        </span>
        <select value={winner} onChange={(e) => setWinner(e.target.value)}
          style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text)", padding: "0.4rem 0.6rem", fontSize: "0.875rem" }}>
          <option value="">\u2014 Winner \u2014</option>
          {[teamA, teamB].filter(Boolean).map((t) => (
            <option key={t!.id} value={t!.id}>{t!.name}</option>
          ))}
        </select>
        <select value={games} onChange={(e) => setGames(Number(e.target.value))}
          style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text)", padding: "0.4rem 0.6rem", fontSize: "0.875rem" }}>
          {[4, 5, 6, 7].map((g) => <option key={g} value={g}>in {g}</option>)}
        </select>
        <button onClick={() => onSetWinner(s.id, winner, games)} disabled={!winner} className="btn-accent" style={{ padding: "0.4rem 0.9rem", fontSize: "0.85rem" }}>
          Set Winner
        </button>
        <button onClick={() => onLock(s.id)} className="btn-ghost" style={{ padding: "0.4rem 0.9rem", fontSize: "0.85rem" }}>
          Lock
        </button>
        {(s.winner_id || s.locked) && (
          <button onClick={() => onClearWinner(s.id)} className="btn-ghost" style={{ padding: "0.4rem 0.9rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Clear \u2715
          </button>
        )}
        {status && <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{status}</span>}
      </div>
    </div>
  );
}
