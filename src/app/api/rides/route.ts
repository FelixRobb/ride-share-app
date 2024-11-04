import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const db = await getDb();
  try {
    const rides = await db.all(
      `SELECT r.*, u.name as requester_name
       FROM rides r
       JOIN users u ON r.requester_id = u.id
       WHERE r.status = 'pending'
       OR r.requester_id = ?
       OR r.accepter_id = ?
       ORDER BY r.created_at DESC`,
      [userId, userId]
    );
    return NextResponse.json({ rides });
  } catch (error) {
    console.error('Fetch rides error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { from_location, to_location, time, requester_id } = await request.json();
  const db = await getDb();

  try {
    const result = await db.run(
      "INSERT INTO rides (from_location, to_location, time, requester_id, status) VALUES (?, ?, ?, ?, ?)", 
      [from_location, to_location, time, requester_id, "pending"]
    );

    if (result && result.lastID) {
      const newRide = await db.get("SELECT * FROM rides WHERE id = ?", [result.lastID]);
      return NextResponse.json({ ride: newRide });
    } else {
      throw new Error("Ride creation failed, no ID returned.");
    }
  } catch (error) {
    console.error("Create ride error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
