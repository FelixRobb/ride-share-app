import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(request: Request) {
  // Extract `id` from the request URL path
  const url = new URL(request.url);
  const userId = url.pathname.split('/').at(-2); // Adjust path segment as needed

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const db = await getDb();

  try {
    await db.run('BEGIN TRANSACTION');

    // Delete user's contacts
    await db.run('DELETE FROM contacts WHERE user_id = ? OR contact_id = ?', [userId, userId]);

    // Update rides where user is requester or accepter
    await db.run('UPDATE rides SET status = "cancelled" WHERE requester_id = ? OR accepter_id = ?', [userId, userId]);

    // Delete user's notifications
    await db.run('DELETE FROM notifications WHERE user_id = ?', [userId]);

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
