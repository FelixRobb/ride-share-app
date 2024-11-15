import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  const db = await getDb();
  try {
    const notifications = await db.all(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at ASC",
      [userId]
    );
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId, notificationIds } = await request.json();

  if (!userId || !notificationIds || !Array.isArray(notificationIds)) {
    return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
  }

  const db = await getDb();
  try {
    await db.run('BEGIN TRANSACTION');

    for (const notificationId of notificationIds) {
      await db.run(
        'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
        [notificationId, userId]
      );
    }

    await db.run('COMMIT');
    return NextResponse.json({ success: true });
  } catch (error) {
    await db.run('ROLLBACK');
    console.error("Mark notifications as read error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
