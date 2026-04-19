export default function HowItWorksPage() {
  const scoringRules = [
    { round: "First Round", points: 1, bonus: "+1 for correct # of games" },
    { round: "Conference Semis", points: 2, bonus: "+1 for correct # of games" },
    { round: "Conference Finals", points: 4, bonus: "+1 for correct # of games" },
    { round: "NBA Finals", points: 8, bonus: "+1 for correct # of games" },
  ];

  const tips = [
    "You can change picks any time until a series locks (tipoff of Game 1).",
    "Use the Odds page to see Vegas lines and R1 win probabilities.",
    "Correct games prediction adds a bonus point — so 4-game sweeps are risky!",
    "Later rounds are worth more points, so don't give up if you're behind.",
    "The Finals are worth 8 points — a single correct pick can swing the leaderboard.",
  ];

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          marginBottom: "0.5rem",
        }}
      >
        How It Works
      </h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
        Pick the winner of every series. Score points for each correct call — more in later rounds.
      </p>

      {/* Scoring table */}
      <h2
        style={{
          fontSize: "1rem",
          fontWeight: 700,
          marginBottom: "0.75rem",
        }}
      >
        Scoring
      </h2>
      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "2rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--border)",
                fontSize: "0.78rem",
                color: "var(--text-muted)",
              }}
            >
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600 }}>Round</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: 600 }}>Base Points</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600 }}>Bonus</th>
            </tr>
          </thead>
          <tbody>
            {scoringRules.map((row, i) => (
              <tr
                key={row.round}
                style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
              >
                <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>{row.round}</td>
                <td
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: "center",
                    fontWeight: 700,
                    color: "var(--accent)",
                    fontSize: "1.05rem",
                  }}
                >
                  {row.points}
                </td>
                <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  {row.bonus}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tips */}
      <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>
        First-Timer Tips
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {tips.map((tip, i) => (
          <div
            key={i}
            className="card"
            style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}
          >
            <span
              style={{
                background: "var(--accent-glow)",
                color: "var(--accent)",
                borderRadius: "50%",
                width: 26,
                height: 26,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.78rem",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {i + 1}
            </span>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
