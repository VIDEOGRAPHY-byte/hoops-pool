"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE = "hp_admin_auth";

export async function adminLogin(formData: FormData) {
  const entered = (formData.get("secret") as string)?.trim();
  const actual = process.env.ADMIN_SECRET;

  if (!actual || entered !== actual) {
    redirect("/admin?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, entered, {
    httpOnly: true,
    sameSite: "strict",
    path: "/admin",
    maxAge: 60 * 60 * 8,
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/admin");
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect("/admin");
}
