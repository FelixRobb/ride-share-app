import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { sendImmediateNotification } from "@/lib/pushNotificationService";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  const userId = session.user.id;
  const url = new URL(request.url);
  const rideId = url.pathname.split("/").at(-2);

  try {
    // Get the ride details
    const { data: ride, error: rideError } = await supabase
      .from("rides")
      .select("*")
      .eq("id", rideId)
      .single();

    if (rideError) throw rideError;

    // Check if the user is the requester
    if (ride.requester_id !== userId) {
      return NextResponse.json(
        { error: "You are not the requester of this ride" },
        { status: 403 }
      );
    }

    // Update the ride
    const { data: updatedRide, error: updateError } = await supabase
      .from("rides")
      .update({ status: "cancelled" })
      .eq("id", rideId)
      .select()
      .single();

    if (updateError) throw updateError;

    // If there's an accepter, notify them
    if (ride.accepter_id) {
      // Get the requester's name
      const { data: requester, error: requesterError } = await supabase
        .from("users")
        .select("name")
        .eq("id", userId)
        .single();

      if (requesterError) throw requesterError;

      // Send notification to the accepter
      await sendImmediateNotification(
        ride.accepter_id,
        "Ride Cancelled",
        `${requester.name} has cancelled their ride request from ${ride.from_location} to ${ride.to_location}`
      );

      // Create a notification in the database
      const { error: notificationError } = await supabase.from("notifications").insert({
        user_id: ride.accepter_id,
        message: `${requester.name} has cancelled their ride request from ${ride.from_location} to ${ride.to_location}`,
        type: "rideCancelled",
        related_id: rideId,
      });

      if (notificationError) throw notificationError;
    }

    return NextResponse.json({ ride: updatedRide });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
