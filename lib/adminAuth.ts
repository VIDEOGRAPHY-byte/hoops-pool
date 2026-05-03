import { cookies } from "next/headers";

export async function isAdminAuthorized(req: Request): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  if (req.headers.get("x-admin-secret") === secret) return true;
  const cookieStore = await cookies();
  return cookieStore.get("hp_admin_auth")?.value === secret;
}
