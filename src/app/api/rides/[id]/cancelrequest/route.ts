import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  const { userId } = await request.json();

  // Extract `id` from the request URL
  const url = new URL(request.url);
  const rideId = url.pathname.split('/').at(-2);  // Assuming [id] is in the URL structure

  const db = await getDb();

  try {
    const ride = await db.get('SELECT * FROM rides WHERE id = ? AND requester_id = ?', [rideId, userId]);
    if (!ride) {
      return NextResponse.json({ error: 'Ride not found or you are not the requester' }, { status: 404 });
    }

    await db.run('UPDATE rides SET status = ? WHERE id = ?', ['cancelled', rideId]);
    const updatedRide = await db.get('SELECT * FROM rides WHERE id = ?', [rideId]);
    return NextResponse.json({ ride: updatedRide });
  } catch (error) {
    console.error('Cancel ride request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
