import { cookies } from "next/headers";

const SESSION_COOKIE = "hp_session";

export interface Session {
  participantId: string;
  displayName: string;
  poolId: string;
}