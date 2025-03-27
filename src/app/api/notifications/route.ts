import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { createHash } from "crypto";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching

export async function GET(request: Request) {
  const ifNoneMatch = request.headers.get("If-None-Match");
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = session.user.id;

  try {
    const { data: notifications, error } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100);

    if (error) throw error;

    // Generate ETag based on notifications data
    const etag = createHash("md5").update(JSON.stringify(notifications)).digest("hex");

    // If ETag matches, return 304 Not Modified
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 });
    }

    return NextResponse.json(
      { notifications },
      {
        headers: {
          ETag: etag,
          "Cache-Control": "private, no-cache",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId, notificationIds } = await request.json();

  if (!userId || !notificationIds || !Array.isArray(notificationIds)) {
    return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
  }

  try {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).in("id", notificationIds);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
