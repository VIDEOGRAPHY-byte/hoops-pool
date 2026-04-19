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