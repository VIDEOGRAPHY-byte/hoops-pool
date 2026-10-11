import { createHash, randomBytes } from "node:crypto";

export function newRecoveryCode(): string { return randomBytes(32).toString("base64url"); }
export function recoveryDigest(code: unknown): string | null {
  if (typeof code !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(code)) return null;
  return createHash("sha256").update(code).digest("hex");
}
