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
      `SELECT r.*, u.name as requester_name, u.phone as requester_phone
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
  const { from_location, to_location, time, requester_id, rider_name, rider_phone, note } = await request.json();
  const db = await getDb();

  try {
    await db.run('BEGIN TRANSACTION');

    const result = await db.run(
      "INSERT INTO rides (from_location, to_location, time, requester_id, status, rider_name, rider_phone, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [from_location, to_location, time, requester_id, "pending", rider_name, rider_phone, note]
    );

    if (result && result.lastID) {
      const newRide = await db.get("SELECT * FROM rides WHERE id = ?", [result.lastID]);

      // Notify contacts about the new ride
      const contacts = await db.all('SELECT contact_id FROM contacts WHERE user_id = ? AND status = "accepted"', [requester_id]);
      for (const contact of contacts) {
        await db.run(
          'INSERT INTO notifications (user_id, message, type, related_id) VALUES (?, ?, ?, ?)',
          [contact.contact_id, 'A new ride is available from your contact', 'newRide', result.lastID]
        );
      }

      await db.run('COMMIT');
      return NextResponse.json({ ride: newRide });
    } else {
      throw new Error("Ride creation failed, no ID returned.");
    }
  } catch (error) {
    await db.run('ROLLBACK');
    console.error("Create ride error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}