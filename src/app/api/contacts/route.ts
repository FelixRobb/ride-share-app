import { NextResponse } from 'next/server'
import { getDb, initializeDb } from '@/lib/db'

export async function POST(req: Request) {
  try {
    await initializeDb(); // Ensure the database is initialized
    const db = await getDb();
    const { userId, contactPhone } = await req.json();
    
    const contactUser = await db.get('SELECT id, name, phone FROM users WHERE phone = ?', contactPhone);
    if (!contactUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const result = await db.run(
      'INSERT INTO contacts (user_id, contact_id, status) VALUES (?, ?, ?)',
      [userId, contactUser.id, 'pending']
    );
    const contact = await db.get('SELECT * FROM contacts WHERE id = ?', result.lastID);
    
    return NextResponse.json({ contact: { ...contact, name: contactUser.name, phone: contactUser.phone } });
  } catch (error) {
    console.error('Add contact error:', error);
    return NextResponse.json({ error: 'Failed to add contact' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await initializeDb(); // Ensure the database is initialized
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (userId) {
      const contacts = await db.all(`
        SELECT c.*, u.name, u.phone 
        FROM contacts c 
        JOIN users u ON c.contact_id = u.id 
        WHERE c.user_id = ?
      `, userId);
      return NextResponse.json({ contacts });
    }
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  } catch (error) {
    console.error('Get contacts error:', error);
    return NextResponse.json({ error: 'Failed to get contacts' }, { status: 500 });
  }
}