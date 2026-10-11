import { isAdminAuthorized } from "@/lib/adminAuth";
import { issueRecoveryResponse } from "@/lib/recovery-service";

export async function POST(req: Request) {
  return issueRecoveryResponse(req, isAdminAuthorized);
}
