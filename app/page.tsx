import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import JoinForm from "@/components/JoinForm";

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/bracket");

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
        {/* Logo / hero */}
        <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🏀</div>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            marginBottom: "0.4rem",
          }}
        >
          Hoops Pool
        </h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
          2026 NBA Playoff Bracket Challenge
        </p>

        <div className="card">
          <JoinForm />
        </div>

        <p
          style={{
            marginTop: "1.5rem",
            fontSize: "0.78rem",
            color: "var(--text-dim)",
          }}
        >
          Get the passcode from your group organiser.
        </p>
      </div>
    </main>
  );
}
