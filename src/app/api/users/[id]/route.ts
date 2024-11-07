import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const userId = url.pathname.split('/').at(-2);

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const db = await getDb();

  try {
    await db.run('BEGIN TRANSACTION');

    // Get user's contacts
    const contacts = await db.all('SELECT * FROM contacts WHERE user_id = ? OR contact_id = ?', [userId, userId]);

    // Delete user's contacts
    await db.run('DELETE FROM contacts WHERE user_id = ? OR contact_id = ?', [userId, userId]);

    // Update rides where user is requester or accepter
    await db.run('UPDATE rides SET status = "cancelled" WHERE requester_id = ? OR accepter_id = ?', [userId, userId]);

    // Get affected rides
    const affectedRides = await db.all('SELECT * FROM rides WHERE requester_id = ? OR accepter_id = ?', [userId, userId]);

    // Delete user's notifications
    await db.run('DELETE FROM notifications WHERE user_id = ?', [userId]);

    // Notify contacts about account deletion
    for (const contact of contacts) {
      const otherUserId = 
        contact.user_id.toString() === userId ? contact.contact_id : contact.user_id;
      await db.run(
        'INSERT INTO notifications (user_id, message, type, related_id) VALUES (?, ?, ?, ?)',
        [otherUserId, 'A contact has deleted their account', 'contactDeleted', userId]
      );
    }

    // Notify users affected by ride cancellations
    for (const ride of affectedRides) {
      const notifyUserId =
        ride.requester_id.toString() === userId ? ride.accepter_id : ride.requester_id;
      if (notifyUserId) {
        await db.run(
          'INSERT INTO notifications (user_id, message, type, related_id) VALUES (?, ?, ?, ?)',
          [notifyUserId, 'A ride has been cancelled due to user account deletion', 'rideCancelled', ride.id]
        );
      }
    }

    // Finally, delete the user
    const result = await db.run('DELETE FROM users WHERE id = ?', [userId]);

    await db.run('COMMIT');

    if (result.changes === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}