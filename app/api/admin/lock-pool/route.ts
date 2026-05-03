import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { isAdminAuthorized } from "@/lib/adminAuth";

export async function POST(req: Request) {
  if (!(await isAdminAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { locked } = await req.json();
  const supabase = getAdminClient();

  const { error } = await supabase
    .from("pools")
    .update({ picks_locked_at: locked ? new Date().toISOString() : null })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, locked });
}
