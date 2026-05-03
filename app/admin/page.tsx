import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import AdminPanel from "@/components/AdminPanel";
import type { Series, Team } from "@/lib/types";
import { adminLogin, adminLogout } from "./actions";

export const revalidate = 0;

async function getData() {
  const [seriesRes, teamsRes, poolRes] = await Promise.all([
    supabase
      .from("series")
      .select("*, team_a:teams!series_team_a_id_fkey(*), team_b:teams!series_team_b_id_fkey(*)")
      .order("round")
      .order("slot"),
    supabase.from("teams").select("*"),
    supabase.from("pools").select("picks_locked_at").limit(1).single(),
  ]);
  return {
    series: (seriesRes.data ?? []) as Series[],
    teams: (teamsRes.data ?? []) as Team[],
    poolLocked: !!(poolRes.data?.picks_locked_at),
  };
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("hp_admin_auth")?.value;
  const isAuthed = !!(adminCookie && adminCookie === process.env.ADMIN_SECRET);
  const params = await searchParams;
  const hasError = params?.error === "1";

  if (!isAuthed) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}
      >
        <div
          className="card"
          style={{ width: "100%", maxWidth: 360, padding: "2rem" }}
        >
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              marginBottom: "0.25rem",
            }}
          >
            Admin Access
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.875rem",
              marginBottom: "1.5rem",
            }}
          >
            Enter your admin secret to continue.
          </p>
          {hasError && (
            <p
              style={{
                color: "#ef4444",
                fontSize: "0.8rem",
                marginBottom: "1rem",
              }}
            >
              Incorrect secret. Try again.
            </p>
          )}
          <form action={adminLogin} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input
              type="password"
              name="secret"
              placeholder="Admin secret"
              required
              autoFocus
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                color: "var(--text)",
                padding: "0.6rem 0.75rem",
                fontSize: "0.9rem",
                width: "100%",
              }}
            />
            <button type="submit" className="btn-accent" style={{ width: "100%" }}>
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  const { series, teams, poolLocked } = await getData();
  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem 1rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "0.25rem",
        }}
      >
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
          }}
        >
          Admin Panel
        </h1>
        <form action={adminLogout}>
          <button
            type="submit"
            className="btn-ghost"
            style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
          >
            Sign out
          </button>
        </form>
      </div>
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem", fontSize: "0.875rem" }}>
        Set series winners, lock picks, and refresh odds.
      </p>
      <AdminPanel series={series} teams={teams} poolLocked={poolLocked} />
    </div>
  );
}
