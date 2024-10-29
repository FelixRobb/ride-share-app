import { NextResponse } from 'next/server'
import { getDb, initializeDb } from '@/lib/db'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await initializeDb(); // Ensure the database is initialized
    const db = await getDb();
    const contactId = parseInt(params.id, 10);
    const { userId } = await req.json();

    if (isNaN(contactId)) {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 });
    }

    // Update the contact status to 'accepted'
    await db.run(
      'UPDATE contacts SET status = ? WHERE id = ? AND (user_id = ? OR contact_id = ?)',
      ['accepted', contactId, userId, userId]
    );

    // Fetch the updated contact
    const contact = await db.get(
      `SELECT c.*, u.name, u.phone 
       FROM contacts c 
       JOIN users u ON (c.user_id = u.id OR c.contact_id = u.id) 
       WHERE c.id = ? AND u.id != ?`,
      [contactId, userId]
    );

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found or not authorized' }, { status: 404 });
    }

    return NextResponse.json({ contact });
  } catch (error) {
    console.error('Accept contact error:', error);
    return NextResponse.json({ error: 'Failed to accept contact' }, { status: 500 });
  }
}