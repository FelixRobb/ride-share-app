import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  const { userId } = await request.json();

  const url = new URL(request.url);
  const rideId = url.pathname.split('/').at(-2);

  const db = await getDb();

  try {
    await db.run('BEGIN TRANSACTION');

    const ride = await db.get('SELECT * FROM rides WHERE id = ?', [rideId]);
    if (!ride) {
      await db.run('ROLLBACK');
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    if (ride.status !== 'pending') {
      await db.run('ROLLBACK');
      return NextResponse.json({ error: 'Ride is not available' }, { status: 400 });
    }

    await db.run(
      'UPDATE rides SET accepter_id = ?, status = ? WHERE id = ?',
      [userId, 'accepted', rideId]
    );

    // Notify the ride requester
    await db.run(
      'INSERT INTO notifications (user_id, message, type, related_id) VALUES (?, ?, ?, ?)',
      [ride.requester_id, 'Your ride request has been accepted', 'rideAccepted', rideId]
    );

    const updatedRide = await db.get('SELECT * FROM rides WHERE id = ?', [rideId]);

    await db.run('COMMIT');
    return NextResponse.json({ ride: updatedRide });
  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Accept ride error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}