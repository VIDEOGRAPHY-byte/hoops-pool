"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { encodeAdminSession, matchesSecret, ADMIN_MAX_AGE } from "@/lib/session";

import { allowAuthAttempt } from "@/lib/auth-attempts";

const ADMIN_COOKIE = "hp_admin_auth";

export async function adminLogin(formData: FormData) {
  const entered = formData.get("secret");
  const actual = process.env.ADMIN_SECRET;

  if (!(await allowAuthAttempt("admin-login")) || !matchesSecret(entered, actual)) {
    // Return error signal via redirect with query param (server actions can't return values directly to forms)
    redirect("/admin?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, encodeAdminSession(), {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/admin");
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect("/admin");
}
