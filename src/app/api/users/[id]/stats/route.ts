import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const userId = params.id;

  try {
    // Count completed rides offered by the user
    const { count: ridesOffered, error: offeredError } = await supabase.from("rides").select("*", { count: "exact", head: true }).eq("accepter_id", userId).eq("status", "completed");

    if (offeredError) throw offeredError;

    // Count completed rides requested by the user
    const { count: ridesRequested, error: requestedError } = await supabase.from("rides").select("*", { count: "exact", head: true }).eq("requester_id", userId).eq("status", "completed");

    if (requestedError) throw requestedError;

    return NextResponse.json({
      ridesOffered: ridesOffered || 0,
      ridesRequested: ridesRequested || 0,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
