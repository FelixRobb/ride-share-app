import { NextResponse } from 'next/server'
import { getDb, initializeDb } from '@/lib/db'

export async function DELETE(
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

    const result = await db.run(
      'DELETE FROM contacts WHERE id = ? AND (user_id = ? OR contact_id = ?)',
      [contactId, userId, userId]
    )

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Contact not found or not authorized to delete' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete contact error:', error)
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
  }
}