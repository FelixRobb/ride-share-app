import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/db";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;

    // Delete push subscription from the database
    await supabase.from("push_subscriptions").delete().eq("user_id", userId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "An error occurred during logout" }, { status: 500 });
  }
}
