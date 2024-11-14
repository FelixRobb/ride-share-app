import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rideId = url.pathname.split('/').at(-2);

  const db = await getDb();
  try {
    const notes = await db.all(
      `SELECT rn.*, u.name as user_name
       FROM ride_notes rn
       JOIN users u ON rn.user_id = u.id
       WHERE rn.ride_id = ?
       ORDER BY rn.created_at ASC`,
      [rideId]
    );
    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Fetch ride notes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId, note } = await request.json();
  const url = new URL(request.url);
  const rideId = url.pathname.split('/').at(-2);

  const db = await getDb();

  try {
    const result = await db.run(
      'INSERT INTO ride_notes (ride_id, user_id, note) VALUES (?, ?, ?)',
      [rideId, userId, note]
    );

    const newNote = await db.get(
      `SELECT rn.*, u.name as user_name, r.requester_id as ride_requester_id, r.accepter_id as ride_accepter_id
       FROM ride_notes rn
       JOIN users u ON rn.user_id = u.id
       JOIN rides r ON rn.ride_id = r.id
       WHERE rn.id = ?`,
      [result.lastID]
    );

    // Create a notification for the other user involved in the ride
    const otherUserId = userId === newNote.ride_requester_id ? newNote.ride_accepter_id : newNote.ride_requester_id;
    if (otherUserId) {
      await db.run(
        'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
        [otherUserId, `New message from ${newNote.user_name} for ride ${rideId}`, 'newNote']
      );
    }

    return NextResponse.json({ note: newNote });
  } catch (error) {
    console.error('Add ride note error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}