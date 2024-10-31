import { NextResponse } from 'next/server'
import { getDb, initializeDb } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id
  
  try {
    await initializeDb()
    const db = await getDb()
    const contactId = parseInt(id, 10)
    const { userId } = await request.json()

    if (isNaN(contactId)) {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 })
    }

    await db.run(
      'UPDATE contacts SET status = ? WHERE id = ? AND contact_id = ?',
      ['accepted', contactId, userId]
    )

    const contact = await db.get(`
      SELECT c.*, u.name, u.phone 
      FROM contacts c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.id = ?
    `, contactId)

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found or not authorized' }, { status: 404 })
    }

    return NextResponse.json({ contact })
  } catch (error) {
    console.error('Accept contact error:', error)
    return NextResponse.json({ error: 'Failed to accept contact' }, { status: 500 })
  }
}