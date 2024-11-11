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
      `SELECT rn.*, u.name as user_name
       FROM ride_notes rn
       JOIN users u ON rn.user_id = u.id
       WHERE rn.id = ?`,
      [result.lastID]
    );

    return NextResponse.json({ note: newNote });
  } catch (error) {
    console.error('Add ride note error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}