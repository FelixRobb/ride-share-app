import { NextResponse } from "next/server";
import { initializeDb } from "@/lib/db";

export async function GET(request: Request, { params }: { params: { rideId: string } }) {
  try {
    const rideId = params.rideId;

    const db = await initializeDb();

    const ride = await db.get(
      `
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
      WHERE r.id = ?
    `,
      [rideId]
    );

    if (!ride) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }

    return NextResponse.json({ ride });
  } catch (error) {
    console.error("Error fetching ride:", error);
    return NextResponse.json({ error: "Failed to fetch ride" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { rideId: string } }) {
  try {
    const rideId = params.rideId;
    const { action, userId } = await request.json();

    if (!action || !userId) {
      return NextResponse.json({ error: "Action and user ID are required" }, { status: 400 });
    }

    const db = await initializeDb();

    let ride;
    let notificationType;
    let notificationMessage;

    if (action === "accept") {
      const result = await db.run(
        `
        UPDATE rides
        SET accepter_id = ?, status = 'accepted'
        WHERE id = ? AND status = 'pending'
      `,
        [userId, rideId]
      );

      if (result.changes === 0) {
        return NextResponse.json({ error: "Ride not found or already accepted" }, { status: 404 });
      }

      notificationType = "rideAccepted";
      notificationMessage = `Your ride request has been accepted by user ${userId}`;
    } else if (action === "cancel") {
      const result = await db.run(
        `
        UPDATE rides
        SET status = 'cancelled'
        WHERE id = ? AND (requester_id = ? OR accepter_id = ?)
      `,
        [rideId, userId, userId]
      );

      if (result.changes === 0) {
        return NextResponse.json({ error: "Ride not found or you are not authorized to cancel it" }, { status: 404 });
      }

      notificationType = "rideCancelled";
      notificationMessage = `The ride has been cancelled by ${userId === ride.requester_id ? "the requester" : "the accepter"}`;
    } else if (action === "cancel-offer") {
      const result = await db.run(
        `
        UPDATE rides
        SET accepter_id = NULL, status = 'pending'
        WHERE id = ? AND accepter_id = ?
      `,
        [rideId, userId]
      );

      if (result.changes === 0) {
        return NextResponse.json(
          {
            error: "Ride not found or you are not authorized to cancel the offer",
          },
          { status: 404 }
        );
      }

      notificationType = "offerCancelled";
      notificationMessage = `The ride offer has been cancelled by user ${userId}`;
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    ride = await db.get("SELECT * FROM rides WHERE id = ?", [rideId]);

    // Create notification
    const notificationUserId = userId === ride.requester_id ? ride.accepter_id : ride.requester_id;
    await db.run(
      `
      INSERT INTO notifications (user_id, message, type, ride_id)
      VALUES (?, ?, ?, ?)
    `,
      [notificationUserId, notificationMessage, notificationType, rideId]
    );

    return NextResponse.json({ ride });
  } catch (error) {
    console.error("Error updating ride:", error);
    return NextResponse.json({ error: "Failed to update ride" }, { status: 500 });
  }
}
