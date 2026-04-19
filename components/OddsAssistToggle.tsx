"use client";

import { useState } from "react";

interface OddsAssistToggleProps {
  enabled: boolean;
  onToggle: (v: boolean) => void;
}

export default function OddsAssistToggle({ enabled, onToggle }: OddsAssistToggleProps) {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.4rem 0.85rem",
        borderRadius: "var(--radius)",
        border: `1px solid ${enabled ? "var(--accent)" : "var(--border)"}`,
        background: enabled ? "var(--accent-glow)" : "transparent",
        color: enabled ? "var(--accent)" : "var(--text-muted)",
        fontSize: "0.8rem",
        fontWeight: 600,
        transition: "all 0.15s",
      }}
    >
      <span>{enabled ? "📊 Odds: ON" : "📊 Odds: OFF"}</span>
    </button>
  );
}
