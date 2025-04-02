import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { emitDashboardUpdate } from "@/lib/socketServer";

// This endpoint can be used to manually trigger dashboard updates
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { targetUserId } = await request.json();

    // If targetUserId is provided, emit to that user (admin functionality)
    // Otherwise emit to the current user
    await emitDashboardUpdate(targetUserId || userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in socket route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
