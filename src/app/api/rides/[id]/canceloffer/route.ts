import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await request.json();
  const rideId = params.id;
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