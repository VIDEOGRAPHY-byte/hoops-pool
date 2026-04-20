"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(pool)/actions";
import { useTransition } from "react";

const NAV_ITEMS = [
  { href: "/bracket", label: "ð Bracket" },
  { href: "/leaderboard", label: "ð Board" },
  { href: "/community", label: "ð¥ Community" },
  { href: "/odds", label: "ð Odds" },
  { href: "/how", label: "â How" },
];

export default function Nav({ displayName }: { displayName: string }) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    const confirmed = window.confirm("Sign out? Your picks stay saved on this device.");
    if (!confirmed) return;
    startTransition(async () => {
      await logout();
    });
  }

  // Derive 1-2 char initials from display name
  const initials = displayName
    .split(/\s+/)
    .filter((w) => /[a-zA-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || displayName.slice(0, 1).toUpperCase() || "?";

  // Deterministic color from name
  const hue = Array.from(displayName).reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

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
            fontSize: "1rem",
            letterSpacing: "-0.03em",
            marginRight: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent) 0%, #f97316 100%)",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span className="nav-brand-text" style={{ color: "var(--text)", whiteSpace: "nowrap" }}>
            Hoops Pool{" "}
            <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>Â· 2026</span>
          </span>
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

        {/* User chip + logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          {/* Avatar */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: `hsl(${hue}, 60%, 45%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.68rem",
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <span className="nav-user-name" style={{ fontSize: "0.82rem", color: "var(--text-muted)", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </span>
          <button
            onClick={handleSignOut}
            disabled={isPending}
            className="btn-ghost"
            style={{ padding: "0.3rem 0.7rem", fontSize: "0.78rem" }}
          >
            {isPending ? "â¦" : "Sign out"}
          </button>
        </div>
      </div>
    </nav>
  );
}
