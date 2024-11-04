import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  const { userId } = await request.json();

  // Extract the `id` from the request URL
  const url = new URL(request.url);
  const rideId = url.pathname.split('/').at(-2);  // Assuming [id] is in the URL structure

  const db = await getDb();

  try {
    const ride = await db.get('SELECT * FROM rides WHERE id = ? AND accepter_id = ?', [rideId, userId]);
    if (!ride) {
      return NextResponse.json({ error: 'Ride not found or you are not the accepter' }, { status: 404 });
    }

    await db.run('UPDATE rides SET status = ?, accepter_id = NULL WHERE id = ?', ['pending', rideId]);
    const updatedRide = await db.get('SELECT * FROM rides WHERE id = ?', [rideId]);
    return NextResponse.json({ ride: updatedRide });
  } catch (error) {
    console.error('Cancel ride offer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
