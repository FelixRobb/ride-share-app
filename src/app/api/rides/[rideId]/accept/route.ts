import { NextResponse } from 'next/server'
import { initializeDb } from '@/lib/db'

export async function POST(
  request: Request,
  context: { params: { rideId: string } }
) {
  try {
    // Properly await and destructure the rideId from params
    const { rideId } = context.params
    const { accepterId } = await request.json()

    if (!accepterId) {
      return NextResponse.json(
        { error: 'Accepter ID is required' },
        { status: 400 }
      )
    }

    const db = await initializeDb()

    // Check if the ride exists and is still pending
    const existingRide = await db.get('SELECT * FROM rides WHERE id = ? AND status = ?', [rideId, 'pending'])
    if (!existingRide) {
      return NextResponse.json(
        { error: 'Ride not found or already accepted' },
        { status: 404 }
      )
    }

    // Check if the accepter is a contact of the requester
    const isContact = await db.get(`
      SELECT * FROM contacts 
      WHERE ((user_id = ? AND contact_id = ?) OR (user_id = ? AND contact_id = ?))
      AND status = 'accepted'
    `, [existingRide.requester_id, accepterId, accepterId, existingRide.requester_id])

    if (!isContact) {
      return NextResponse.json(
        { error: 'You are not authorized to accept this ride' },
        { status: 403 }
      )
    }

    // Update the ride status to accepted
    const result = await db.run(`
      UPDATE rides
      SET accepter_id = ?, status = 'accepted'
      WHERE id = ?
    `, [accepterId, rideId])

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Failed to accept the ride' },
        { status: 500 }
      )
    }

    // Fetch the updated ride
    const updatedRide = await db.get(`
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
      JOIN users u2 ON r.accepter_id = u2.id
      WHERE r.id = ?
    `, [rideId])

    // Create a notification for the ride requester
    await db.run(`
      INSERT INTO notifications (user_id, message, type)
      VALUES (?, ?, 'rideAccepted')
    `, [updatedRide.requester_id, `Your ride request has been accepted by ${updatedRide.accepter_name}`])

    return NextResponse.json({ ride: updatedRide })
  } catch (error) {
    console.error('Error accepting ride:', error)
    return NextResponse.json(
      { error: 'Failed to accept ride' },
      { status: 500 }
    )
  }
}