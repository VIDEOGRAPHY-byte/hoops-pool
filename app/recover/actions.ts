"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { redeemRecoveryIdentity } from "@/lib/recovery-service";
import { encodeSession, SESSION_MAX_AGE } from "@/lib/session";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export async function recoverAccess(form: FormData): Promise<{ error: string } | undefined> {
  const member = await redeemRecoveryIdentity(form.get("code"));
  if (!member) return { error: "That code is unavailable. Ask your organiser for a new code, or wait 15 minutes before retrying." };
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, encodeSession(member), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE, secure: process.env.NODE_ENV === "production",
  });
  redirect("/bracket");
}
