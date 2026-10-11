import { createHmac, timingSafeEqual } from "node:crypto";

export interface Session {
  participantId: string;
  poolId: string;
  sessionVersion: number;
}
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
export const ADMIN_MAX_AGE = 60 * 60 * 8;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: unknown): value is string => typeof value === "string" && UUID.test(value);

function secret(name: "SESSION_SECRET" | "ADMIN_SECRET"): string {
  const value = process.env[name];
  if (!value || value.length < 32) throw new Error(`${name} must contain at least 32 characters`);
  return value;
}
function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}
function encode(data: object, purpose: string, age: number, key: string, now: number): string {
  const payload = Buffer.from(JSON.stringify({ ...data, purpose, exp: now + age })).toString("base64url");
  return `${payload}.${sign(payload, key)}`;
}
function decode(raw: string, purpose: string, age: number, key: string, now: number): Record<string, unknown> | null {
  if (raw.length > 2048 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(raw)) return null;
  const [payload, signature] = raw.split(".");
  const expected = sign(payload, key);
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (!data || typeof data !== "object" || data.purpose !== purpose ||
      !Number.isSafeInteger(data.exp) || data.exp <= now || data.exp > now + age) return null;
  return data;
}
export function validateSessionConfiguration(): void { secret("SESSION_SECRET"); }
export function encodeSession(session: Session, now = Math.floor(Date.now() / 1000)): string {
  const { participantId, poolId, sessionVersion } = session;
  return encode({ participantId, poolId, sessionVersion }, "participant", SESSION_MAX_AGE, secret("SESSION_SECRET"), now);
}
export function decodeSession(raw: string, now = Math.floor(Date.now() / 1000)): Session | null {
  try {
    const data = decode(raw, "participant", SESSION_MAX_AGE, secret("SESSION_SECRET"), now);
    if (!data || !isUuid(data.participantId) || !isUuid(data.poolId) ||
        !Number.isSafeInteger(data.sessionVersion) || (data.sessionVersion as number) < 0) return null;
    return { participantId: data.participantId, poolId: data.poolId, sessionVersion: data.sessionVersion as number };
  } catch { return null; }
}
export function encodeAdminSession(now = Math.floor(Date.now() / 1000)): string {
  return encode({}, "admin", ADMIN_MAX_AGE, secret("ADMIN_SECRET"), now);
}
export function validAdminSession(raw: string, now = Math.floor(Date.now() / 1000)): boolean {
  try { return !!decode(raw, "admin", ADMIN_MAX_AGE, secret("ADMIN_SECRET"), now); }
  catch { return false; }
}
export function matchesSecret(entered: unknown, actual: string | undefined): boolean {
  if (typeof entered !== "string" || !actual || actual.length < 32) return false;
  const a = Buffer.from(entered), b = Buffer.from(actual);
  return a.length === b.length && timingSafeEqual(a, b);
}
