import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const db = await getDb();
  try {
    const contacts = await db.all(
      `SELECT c.*, 
              u1.name as user_name, u1.phone as user_phone,
              u2.name as contact_name, u2.phone as contact_phone
       FROM contacts c
       JOIN users u1 ON c.user_id = u1.id
       JOIN users u2 ON c.contact_id = u2.id
       WHERE c.user_id = ? OR c.contact_id = ?`,
      [userId, userId]
    );

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Fetch contacts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId, contactPhone } = await request.json();
  const db = await getDb();

  try {
    await db.run('BEGIN TRANSACTION');

    const contactUser = await db.get('SELECT id, name, phone FROM users WHERE phone = ?', [contactPhone]);
    if (!contactUser) {
      await db.run('ROLLBACK');
      return NextResponse.json({ error: 'Contact user not found' }, { status: 404 });
    }

    const existingContact = await db.get(
      'SELECT * FROM contacts WHERE (user_id = ? AND contact_id = ?) OR (user_id = ? AND contact_id = ?)',
      [userId, contactUser.id, contactUser.id, userId]
    );

    if (existingContact) {
      await db.run('ROLLBACK');
      return NextResponse.json({ error: 'Contact already exists' }, { status: 409 });
    }

    const result = await db.run(
      'INSERT INTO contacts (user_id, contact_id, status) VALUES (?, ?, ?)',
      [userId, contactUser.id, 'pending']
    );

    // Create notification for the contact user
    await db.run(
      'INSERT INTO notifications (user_id, message, type, related_id) VALUES (?, ?, ?, ?)',
      [contactUser.id, 'You have a new contact request', 'contactRequest', result.lastID]
    );

    const newContact = {
      id: result.lastID,
      user_id: userId,
      contact_id: contactUser.id,
      status: 'pending',
      created_at: new Date().toISOString(),
      contact_name: contactUser.name,
      contact_phone: contactUser.phone
    };

    await db.run('COMMIT');
    return NextResponse.json({ contact: newContact });
  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Add contact error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}