import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const contactId = url.pathname.split('/').at(-2);

  const { userId } = await request.json();
  const db = await getDb();

  try {
    await db.run('BEGIN TRANSACTION');

    const contact = await db.get('SELECT * FROM contacts WHERE id = ? AND contact_id = ?', [contactId, userId]);
    if (!contact) {
      await db.run('ROLLBACK');
      return NextResponse.json({ error: 'Contact request not found' }, { status: 404 });
    }

    await db.run('UPDATE contacts SET status = ? WHERE id = ?', ['accepted', contactId]);

    // Create notification for the user who sent the request
    await db.run(
      'INSERT INTO notifications (user_id, message, type, related_id) VALUES (?, ?, ?, ?)',
      [contact.user_id, 'Your contact request has been accepted', 'contactAccepted', contactId]
    );

    const updatedContact = await db.get(
      `SELECT c.*, 
              u1.name as user_name, u1.phone as user_phone,
              u2.name as contact_name, u2.phone as contact_phone
       FROM contacts c
       JOIN users u1 ON c.user_id = u1.id
       JOIN users u2 ON c.contact_id = u2.id
       WHERE c.id = ?`,
      [contactId]
    );

    await db.run('COMMIT');
    return NextResponse.json({ contact: updatedContact });
  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Accept contact error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}