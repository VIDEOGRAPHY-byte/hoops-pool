import { supabase } from "@/lib/supabase";
import AdminPanel from "@/components/AdminPanel";
import type { Series, Team } from "@/lib/types";

export const revalidate = 0;

async function getData() {
  const [seriesRes, teamsRes] = await Promise.all([
    supabase
      .from("series")
      .select("*, team_a:teams!series_team_a_id_fkey(*), team_b:teams!series_team_b_id_fkey(*)")
      .order("round")
      .order("slot"),
    supabase.from("teams").select("*"),
  ]);
  return {
    series: (seriesRes.data ?? []) as Series[],
    teams: (teamsRes.data ?? []) as Team[],
  };
}

export default async function AdminPage() {
  const { series, teams } = await getData();
  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          marginBottom: "0.25rem",
        }}
      >
        Admin Panel
      </h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem", fontSize: "0.875rem" }}>
        Set series winners, lock picks, and refresh odds.
      </p>
      <AdminPanel series={series} teams={teams} />
    </div>
  );
}
