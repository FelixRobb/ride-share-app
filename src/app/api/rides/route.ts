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

    const rides = await db.all(`
      SELECT 
        r.id,
        r.from_location,
        r.to_location,
        r.time,
        r.requester_id,
        r.accepter_id,
        r.status,
        u1.name as requester_name,
        u2.name as accepter_name
      FROM rides r
      JOIN users u1 ON r.requester_id = u1.id
      LEFT JOIN users u2 ON r.accepter_id = u2.id
      WHERE r.requester_id = ? OR r.accepter_id = ? OR r.requester_id IN (
        SELECT CASE
          WHEN c.user_id = ? THEN c.contact_id
          WHEN c.contact_id = ? THEN c.user_id
        END
        FROM contacts c
        WHERE (c.user_id = ? OR c.contact_id = ?) AND c.status = 'accepted'
      )
    `, [userId, userId, userId, userId, userId, userId])

    return NextResponse.json({ rides })
  } catch (error) {
    console.error('Error fetching rides:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rides' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { from, to, time, requesterId } = await request.json()

    if (!from || !to || !time || !requesterId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const db = await initializeDb()

    const result = await db.run(`
      INSERT INTO rides (from_location, to_location, time, requester_id, status)
      VALUES (?, ?, ?, ?, 'pending')
    `, [from, to, time, requesterId])

    const ride = await db.get('SELECT * FROM rides WHERE id = ?', [result.lastID])

    // Notify contacts about the new ride request
    const contacts = await db.all(`
      SELECT user_id, contact_id
      FROM contacts
      WHERE (user_id = ? OR contact_id = ?) AND status = 'accepted'
    `, [requesterId, requesterId])

    for (const contact of contacts) {
      const notificationUserId = contact.user_id === requesterId ? contact.contact_id : contact.user_id
      await db.run(`
        INSERT INTO notifications (user_id, message, type, ride_id)
        VALUES (?, ?, 'rideRequest', ?)
      `, [notificationUserId, `User ${requesterId} has requested a ride`, result.lastID])
    }

    return NextResponse.json({ ride })
  } catch (error) {
    console.error('Error creating ride:', error)
    return NextResponse.json(
      { error: 'Failed to create ride' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rideId = searchParams.get('rideId')
    const { action, userId } = await request.json()

    if (!rideId || !action || !userId) {
      return NextResponse.json(
        { error: 'Ride ID, action, and user ID are required' },
        { status: 400 }
      )
    }

    const db = await initializeDb()

    let ride
    let notificationType
    let notificationMessage

    if (action === 'accept') {
      const result = await db.run(`
        UPDATE rides
        SET accepter_id = ?, status = 'accepted'
        WHERE id = ? AND status = 'pending'
      `, [userId, rideId])

      if (result.changes === 0) {
        return NextResponse.json(
          { error: 'Ride not found or already accepted' },
          { status: 404 }
        )
      }

      notificationType = 'rideAccepted'
      notificationMessage = `Your ride request has been accepted by user ${userId}`
    } else if (action === 'cancel') {
      const result = await db.run(`
        UPDATE rides
        SET status = 'cancelled'
        WHERE id = ? AND (requester_id = ? OR accepter_id = ?)
      `, [rideId, userId, userId])

      if (result.changes === 0) {
        return NextResponse.json(
          { error: 'Ride not found or you are not authorized to cancel it' },
          { status: 404 }
        )
      }

      notificationType = 'rideCancelled'
      notificationMessage = `The ride has been cancelled by ${userId === ride.requester_id ? 'the requester' : 'the accepter'}`
    } else if (action === 'cancel-offer') {
      const result = await db.run(`
        UPDATE rides
        SET accepter_id = NULL, status = 'pending'
        WHERE id = ? AND accepter_id = ?
      `, [rideId, userId])

      if (result.changes === 0) {
        return NextResponse.json(
          { error: 'Ride not found or you are not authorized to cancel the offer' },
          { status: 404 }
        )
      }

      notificationType = 'offerCancelled'
      notificationMessage = `The ride offer has been cancelled by user ${userId}`
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    ride = await db.get('SELECT * FROM rides WHERE id = ?', [rideId])

    // Create notification
    const notificationUserId = userId === ride.requester_id ? ride.accepter_id : ride.requester_id
    await db.run(`
      INSERT INTO notifications (user_id, message, type, ride_id)
      VALUES (?, ?, ?, ?)
    `, [notificationUserId, notificationMessage, notificationType, rideId])

    return NextResponse.json({ ride })
  } catch (error) {
    console.error('Error updating ride:', error)
    return NextResponse.json(
      { error: 'Failed to update ride' },
      { status: 500 }
    )
  }
}