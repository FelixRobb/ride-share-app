import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  const { userId } = await request.json();

  const url = new URL(request.url);
  const rideId = url.pathname.split('/').at(-2);

  const db = await getDb();

  try {
    await db.run('BEGIN TRANSACTION');

    const ride = await db.get('SELECT * FROM rides WHERE id = ? AND requester_id = ?', [rideId, userId]);
    if (!ride) {
      await db.run('ROLLBACK');
      return NextResponse.json({ error: 'Ride not found or you are not the requester' }, { status: 404 });
    }

    await db.run('UPDATE rides SET status = ? WHERE id = ?', ['cancelled', rideId]);

    if (ride.accepter_id) {
      // Notify the ride accepter if there is one
      await db.run(
        'INSERT INTO notifications (user_id, message, type, related_id) VALUES (?, ?, ?, ?)',
        [ride.accepter_id, 'A ride you accepted has been cancelled by the requester', 'rideCancelled', rideId]
      );
    }

    const updatedRide = await db.get('SELECT * FROM rides WHERE id = ?', [rideId]);

    await db.run('COMMIT');
    return NextResponse.json({ ride: updatedRide });
  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Cancel ride request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}