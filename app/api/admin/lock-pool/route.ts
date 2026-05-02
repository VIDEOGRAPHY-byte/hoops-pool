import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { locked } = await req.json();
  const supabase = getAdminClient();

  // Update the first (and only) pool's lock state
  const { error } = await supabase
    .from("pools")
    .update({ picks_locked_at: locked ? new Date().toISOString() : null })
    .neq("id", "00000000-0000-0000-0000-000000000000"); // update all rows

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, locked });
}
