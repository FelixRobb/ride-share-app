import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  // Extract the `id` param directly from the request URL
  const url = new URL(request.url);
  const contactId = url.pathname.split('/').at(-2);  // assuming [id] is in the URL structure

  const { userId } = await request.json();
  const db = await getDb();

  try {
    const contact = await db.get('SELECT * FROM contacts WHERE id = ? AND contact_id = ?', [contactId, userId]);
    if (!contact) {
      return NextResponse.json({ error: 'Contact request not found' }, { status: 404 });
    }

    await db.run('UPDATE contacts SET status = ? WHERE id = ?', ['accepted', contactId]);
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
    return NextResponse.json({ contact: updatedContact });
  } catch (error) {
    console.error('Accept contact error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
