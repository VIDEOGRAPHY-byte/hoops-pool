import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { isAdminAuthorized } from "@/lib/adminAuth";

export async function POST(req: Request) {
  if (!(await isAdminAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { series_id } = body;

  if (!series_id) {
    return NextResponse.json({ error: "series_id required" }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { error } = await supabase
    .from("series")
    .update({ locked: true })
    .eq("id", series_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
