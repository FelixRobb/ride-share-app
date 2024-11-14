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
    // Fetch all rides related to the user
    const userRides = await db.all(
      `SELECT r.*, 
              u_requester.name as requester_name, u_requester.phone as requester_phone,
              u_accepter.name as accepter_name, u_accepter.phone as accepter_phone
       FROM rides r
       LEFT JOIN users u_requester ON r.requester_id = u_requester.id
       LEFT JOIN users u_accepter ON r.accepter_id = u_accepter.id
       WHERE r.requester_id = ? OR r.accepter_id = ?
       ORDER BY r.created_at DESC`,
      [userId, userId]
    );

    // Fetch all contacts of the user
    const userContacts = await db.all(
      `SELECT contact_id FROM contacts 
       WHERE user_id = ? AND status = 'accepted'
       UNION
       SELECT user_id FROM contacts
       WHERE contact_id = ? AND status = 'accepted'`,
      [userId, userId]
    );
    
    const contactIds = userContacts.map((contact: { contact_id?: number; user_id?: number }) => contact.contact_id || contact.user_id);
    
    // Fetch available rides from contacts
    const availableRides = await db.all(
      `SELECT r.*, 
              u_requester.name as requester_name, u_requester.phone as requester_phone
       FROM rides r
       JOIN users u_requester ON r.requester_id = u_requester.id
       WHERE r.status = 'pending'
       AND r.requester_id IN (${contactIds.map(() => '?').join(',')})
       AND r.requester_id != ?`,
      [...contactIds, userId]
    );

    // Combine user rides and available rides
    const allRides = [...userRides, ...availableRides];

    // Remove duplicates (in case a user's ride is also in available rides)
    const uniqueRides = allRides.filter((ride, index, self) =>
      index === self.findIndex((t) => t.id === ride.id)
    );

    return NextResponse.json({ rides: uniqueRides });
  } catch (error) {
    console.error('Fetch rides error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { from_location, to_location, time, requester_id, rider_name, rider_phone, note } = await request.json();
  const db = await getDb();

  try {
    await db.run('BEGIN TRANSACTION');

    const result = await db.run(
      "INSERT INTO rides (from_location, to_location, time, requester_id, status, rider_name, rider_phone, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [from_location, to_location, time, requester_id, "pending", rider_name, rider_phone, note]
    );

    if (result && result.lastID) {
      const newRide = await db.get("SELECT * FROM rides WHERE id = ?", [result.lastID]);

      // Notify contacts about the new ride
      const contacts = await db.all('SELECT contact_id FROM contacts WHERE user_id = ? AND status = "accepted"', [requester_id]);
      for (const contact of contacts) {
        await db.run(
          'INSERT INTO notifications (user_id, message, type, related_id) VALUES (?, ?, ?, ?)',
          [contact.contact_id, 'A new ride is available from your contact', 'newRide', result.lastID]
        );
      }

      await db.run('COMMIT');
      return NextResponse.json({ ride: newRide });
    } else {
      throw new Error("Ride creation failed, no ID returned.");
    }
  } catch (error) {
    await db.run('ROLLBACK');
    console.error("Create ride error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}