import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabase } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.id as string;

    // Delete push subscription from the database
    await supabase.from("push_subscriptions").delete().eq("user_id", userId);

    // Clear the session (this will be handled by NextAuth.js signOut function on the client side)

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "An error occurred during logout" }, { status: 500 });
  }
}
