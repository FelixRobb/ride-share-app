import { NextResponse } from 'next/server'
import { getDb, initializeDb } from '@/lib/db'

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  let db = null;
  
  try {
    // Properly destructure and await the id from params
    const { id } = await Promise.resolve(context.params);
    
    await initializeDb();
    db = await getDb();
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    await db.run('BEGIN TRANSACTION');

    // Delete user's contacts
    await db.run('DELETE FROM contacts WHERE user_id = ? OR contact_id = ?', [userId, userId]);

    // Delete user's rides
    await db.run('DELETE FROM rides WHERE requester_id = ? OR accepter_id = ?', [userId, userId]);

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
    // Only attempt rollback if db was initialized
    if (db) {
      await db.run('ROLLBACK').catch(rollbackError => {
        console.error('Rollback failed:', rollbackError);
      });
    }
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
