import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getDeviceId } from "@/utils/deviceUtils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscription } = await request.json();
    const deviceId = getDeviceId();

    // If there's a subscription, delete it from the database
    if (subscription) {
      await supabase.from("push_subscriptions").delete().match({
        user_id: session.user.id,
        device_id: deviceId,
        endpoint: subscription.endpoint, // Add endpoint to ensure we delete the correct subscription
      });
    }

    return NextResponse.json({ message: "Logged out successfully" });
  } catch {
    return NextResponse.json({ error: "An error occurred during logout" }, { status: 500 });
  }
}
