import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = session.user.id;

  try {
    // Count completed rides offered by the user
    const { count: ridesOffered, error: offeredError } = await supabase
      .from("rides")
      .select("*", { count: "exact", head: true })
      .eq("accepter_id", userId)
      .eq("status", "completed");

    if (offeredError) throw offeredError;

    // Count completed rides requested by the user
    const { count: ridesRequested, error: requestedError } = await supabase
      .from("rides")
      .select("*", { count: "exact", head: true })
      .eq("requester_id", userId)
      .eq("status", "completed");

    if (requestedError) throw requestedError;

    return NextResponse.json({
      ridesOffered: ridesOffered || 0,
      ridesRequested: ridesRequested || 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
