import { NextResponse } from 'next/server'
import { initializeDb } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const db = await initializeDb()

    // Get all contacts where the user is either the requester or receiver
    const contacts = await db.all(`
      SELECT 
        c.id,
        c.user_id,
        c.contact_id,
        c.status,
        u1.name as requester_name,
        u1.phone as requester_phone,
        u2.name as receiver_name,
        u2.phone as receiver_phone
      FROM contacts c
      JOIN users u1 ON c.user_id = u1.id
      JOIN users u2 ON c.contact_id = u2.id
      WHERE c.user_id = ? OR c.contact_id = ?
      GROUP BY 
        CASE 
          WHEN c.user_id < c.contact_id THEN c.user_id 
          ELSE c.contact_id 
        END,
        CASE 
          WHEN c.user_id < c.contact_id THEN c.contact_id 
          ELSE c.user_id 
        END
    `, [userId, userId])

    // Transform the results to ensure consistent format
    const transformedContacts = contacts.map(contact => {
      const isRequester = contact.user_id.toString() === userId
      return {
        id: contact.id,
        user_id: contact.user_id,
        contact_id: contact.contact_id,
        status: contact.status,
        name: isRequester ? contact.receiver_name : contact.requester_name,
        phone: isRequester ? contact.receiver_phone : contact.requester_phone
      }
    })

    return NextResponse.json({ contacts: transformedContacts })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { userId, contactPhone } = await request.json()

    if (!userId || !contactPhone) {
      return NextResponse.json(
        { error: 'User ID and contact phone are required' },
        { status: 400 }
      )
    }

    const db = await initializeDb()

    // Check if user exists
    const contactUser = await db.get(
      'SELECT * FROM users WHERE phone = ?',
      [contactPhone]
    )

    if (!contactUser) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    if (contactUser.id === userId) {
      return NextResponse.json(
        { error: 'Cannot add yourself as a contact' },
        { status: 400 }
      )
    }

    // Check if contact already exists
    const existingContact = await db.get(`
      SELECT * FROM contacts 
      WHERE (user_id = ? AND contact_id = ?) 
         OR (user_id = ? AND contact_id = ?)
    `, [userId, contactUser.id, contactUser.id, userId])

    if (existingContact) {
      return NextResponse.json(
        { error: 'Contact already exists' },
        { status: 400 }
      )
    }

    // Create new contact
    const result = await db.run(`
      INSERT INTO contacts (user_id, contact_id, status)
      VALUES (?, ?, 'pending')
    `, [userId, contactUser.id])

    const contact = {
      id: result.lastID,
      user_id: userId,
      contact_id: contactUser.id,
      status: 'pending',
      name: contactUser.name,
      phone: contactUser.phone
    }

    return NextResponse.json({ contact })
  } catch (error) {
    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    )
  }
}