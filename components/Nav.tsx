"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(pool)/actions";

const NAV_ITEMS = [
  { href: "/bracket", label: "🏀 Bracket" },
  { href: "/leaderboard", label: "🏆 Board" },
  { href: "/odds", label: "📊 Odds" },
  { href: "/how", label: "❓ How" },
];

export default function Nav({ displayName }: { displayName: string }) {
  const pathname = usePathname();

  return (
    <nav
      style={{
        borderBottom: "1px solid var(--border)",
        background: "rgba(15,15,15,0.95)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          height: 52,
        }}
      >
        {/* Brand */}
        <span
          style={{
            fontWeight: 800,
            fontSize: "1.1rem",
            letterSpacing: "-0.03em",
            marginRight: "0.75rem",
            color: "var(--accent)",
          }}
        >
          HP
        </span>

        {/* Nav links */}
        <div
          className="no-scrollbar"
          style={{
            display: "flex",
            gap: "0.1rem",
            flex: 1,
            overflowX: "auto",
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: "0.35rem 0.7rem",
                  borderRadius: "var(--radius)",
                  fontSize: "0.875rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--text)" : "var(--text-muted)",
                  background: active ? "var(--bg-card)" : "transparent",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* User + logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "none" }} className="sm-show">
            {displayName}
          </span>
          <form action={logout}>
            <button type="submit" className="btn-ghost" style={{ padding: "0.3rem 0.7rem", fontSize: "0.78rem" }}>
              Out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
