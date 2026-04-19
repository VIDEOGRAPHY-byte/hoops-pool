import type { LeaderboardEntry } from "@/lib/types";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentParticipantId?: string;
}

export default function LeaderboardTable({
  entries,
  currentParticipantId,
}: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div
        className="card"
        style={{ textAlign: "center", color: "var(--text-muted)", padding: "3rem" }}
      >
        No participants yet. Share the passcode!
      </div>
    );
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
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
            <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, width: 36 }}>#</th>
            <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600 }}>Player</th>
            <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: 600 }}>Pts</th>
            <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: 600 }}>Correct</th>
            <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: 600 }}>Max</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => {
            const isMe = entry.participant.id === currentParticipantId;
            return (
              <tr
                key={entry.participant.id}
                style={{
                  borderTop: i === 0 ? "none" : "1px solid var(--border)",
                  background: isMe ? "var(--accent-glow)" : "transparent",
                }}
              >
                <td
                  style={{
                    padding: "0.8rem 1rem",
                    fontSize: "0.9rem",
                    color: entry.rank <= 3 ? "var(--text)" : "var(--text-muted)",
                  }}
                >
                  {entry.rank <= 3 ? medals[entry.rank - 1] : entry.rank}
                </td>
                <td style={{ padding: "0.8rem 1rem" }}>
                  <span style={{ fontWeight: isMe ? 700 : 500 }}>
                    {entry.participant.display_name}
                  </span>
                  {isMe && (
                    <span
                      style={{
                        marginLeft: "0.5rem",
                        fontSize: "0.7rem",
                        color: "var(--accent)",
                        fontWeight: 600,
                      }}
                    >
                      YOU
                    </span>
                  )}
                </td>
                <td
                  style={{
                    padding: "0.8rem 1rem",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "1.05rem",
                    color: isMe ? "var(--accent)" : "var(--text)",
                  }}
                >
                  {entry.total_points}
                </td>
                <td
                  style={{
                    padding: "0.8rem 1rem",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: "0.875rem",
                  }}
                >
                  {entry.correct_picks}
                </td>
                <td
                  style={{
                    padding: "0.8rem 1rem",
                    textAlign: "center",
                    color: "var(--text-dim)",
                    fontSize: "0.875rem",
                  }}
                >
                  {entry.possible_points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
