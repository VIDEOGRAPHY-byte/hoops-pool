import { supabase } from "@/lib/supabase";
import { formatAmericanOdds } from "@/lib/odds";
import type { Team, OddsSnapshot } from "@/lib/types";

export const revalidate = 3600;

async function getData() {
  const [teamsRes, oddsRes] = await Promise.all([
    supabase.from("teams").select("*").order("conference").order("seed"),
    supabase
      .from("odds_snapshots")
      .select("*")
      .order("fetched_at", { ascending: false })
      .limit(32),
  ]);

  return {
    teams: (teamsRes.data ?? []) as Team[],
    odds: (oddsRes.data ?? []) as OddsSnapshot[],
  };
}

export default async function OddsPage() {
  const { teams, odds } = await getData();

  // Latest snapshot per team
  const latestOdds = new Map<string, OddsSnapshot>();
  for (const snap of odds) {
    if (!latestOdds.has(snap.team_id)) {
      latestOdds.set(snap.team_id, snap);
    }
  }

  const conferences = ["East", "West"] as const;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
          }}
        >
          Odds & Futures
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "0.25rem", fontSize: "0.875rem" }}>
          Championship odds updated daily via ESPN. Use these to inform your picks.
        </p>
      </div>

      {conferences.map((conf) => {
        const confTeams = teams.filter((t) => t.conference === conf);
        return (
          <div key={conf} style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "0.9rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: conf === "East" ? "var(--east)" : "var(--west)",
                marginBottom: "0.75rem",
              }}
            >
              {conf}ern Conference
            </h2>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--border)",
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600 }}>Team</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: 600 }}>Seed</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: 600 }}>Championship</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600 }}>R1 Win Prob</th>
                  </tr>
                </thead>
                <tbody>
                  {confTeams.map((team, i) => {
                    const snap = latestOdds.get(team.id);
                    const winProb = snap?.r1_win_prob ?? 0;
                    return (
                      <tr
                        key={team.id}
                        style={{
                          borderTop: i === 0 ? "none" : "1px solid var(--border)",
                        }}
                      >
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>
                          {team.name}
                        </td>
                        <td
                          style={{
                            padding: "0.75rem 1rem",
                            textAlign: "center",
                            color: "var(--text-muted)",
                            fontSize: "0.875rem",
                          }}
                        >
                          #{team.seed}
                        </td>
                        <td
                          style={{
                            padding: "0.75rem 1rem",
                            textAlign: "center",
                            fontWeight: 600,
                            color: snap ? "var(--text)" : "var(--text-dim)",
                          }}
                        >
                          {snap ? formatAmericanOdds(snap.championship_odds) : "—"}
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div
                              style={{
                                flex: 1,
                                height: 6,
                                background: "var(--border)",
                                borderRadius: 999,
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${(winProb * 100).toFixed(0)}%`,
                                  height: "100%",
                                  background: conf === "East" ? "var(--east)" : "var(--west)",
                                  borderRadius: 999,
                                  transition: "width 0.4s ease",
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: "0.78rem",
                                color: "var(--text-muted)",
                                minWidth: 36,
                              }}
                            >
                              {snap ? `${(winProb * 100).toFixed(0)}%` : "—"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
