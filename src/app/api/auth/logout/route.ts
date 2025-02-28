import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let subscription;
    let deviceId;
    try {
      const body = await request.json();
      subscription = body.subscription;
      deviceId = body.deviceId; // Get deviceId from the client request instead
    } catch {
      // If request.json() fails, continue without subscription data
      subscription = null;
      deviceId = null;
    }

    // If there's a subscription and deviceId, delete it from the database
    if (subscription && deviceId) {
      await supabase.from("push_subscriptions").delete().match({
        user_id: session.user.id,
        device_id: deviceId,
      });
    }

    return NextResponse.json({ message: "Logged out successfully" });
  } catch {
    return NextResponse.json({ error: "An error occurred during logout" }, { status: 500 });
  }
}
