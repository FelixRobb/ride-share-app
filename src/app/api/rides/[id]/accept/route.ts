import { NextResponse } from "next/server";

import { supabase } from "@/lib/db";
import { sendImmediateNotification } from "@/lib/pushNotificationService";

export async function POST(request: Request) {
  const { userId } = await request.json();
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

    // Check if the ride is already accepted
    if (ride.accepter_id) {
      return NextResponse.json({ error: "Ride already accepted" }, { status: 400 });
    }

    // Update the ride
    const { data: updatedRide, error: updateError } = await supabase
      .from("rides")
      .update({ accepter_id: userId, status: "accepted" })
      .eq("id", rideId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Get the accepter's name
    const { data: accepter, error: accepterError } = await supabase
      .from("users")
      .select("name")
      .eq("id", userId)
      .single();

    if (accepterError) throw accepterError;

    // Send notification to the requester
    await sendImmediateNotification(
      ride.requester_id,
      "Ride Accepted",
      `${accepter.name} has accepted your ride from ${ride.from_location} to ${ride.to_location}`
    );

    // Create a notification in the database
    const { error: notificationError } = await supabase.from("notifications").insert({
      user_id: ride.requester_id,
      message: `${accepter.name} has accepted your ride from ${ride.from_location} to ${ride.to_location}`,
      type: "rideAccepted",
      related_id: rideId,
    });

    if (notificationError) throw notificationError;

    return NextResponse.json({ ride: updatedRide });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
