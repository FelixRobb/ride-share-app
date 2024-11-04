import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(request: Request) {
  // Extract the `id` param directly from the request URL
  const url = new URL(request.url);
  const contactId = url.pathname.split('/').at(-2);  // Assuming [id] is in the URL structure

  const db = await getDb();

  try {
    const result = await db.run('DELETE FROM contacts WHERE id = ?', [contactId]);
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete contact error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
