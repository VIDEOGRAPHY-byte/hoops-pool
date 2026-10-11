import { cookies } from "next/headers";
import { adminCredentialsAuthorized } from "./session-policy";

export async function isAdminAuthorized(req: Request): Promise<boolean> {
  return adminCredentialsAuthorized(req, (await cookies()).get("hp_admin_auth")?.value ?? "");
}
