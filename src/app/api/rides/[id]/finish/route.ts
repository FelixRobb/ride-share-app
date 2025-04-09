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

    // Check if the user is involved in the ride
    if (ride.requester_id !== userId && ride.accepter_id !== userId) {
      return NextResponse.json({ error: "You are not involved in this ride" }, { status: 403 });
    }

    // Check if the ride is already completed
    if (ride.status === "completed") {
      return NextResponse.json({ error: "Ride already completed" }, { status: 400 });
    }

    // Update the ride
    const { data: updatedRide, error: updateError } = await supabase
      .from("rides")
      .update({ status: "completed" })
      .eq("id", rideId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Get the user's name
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("name")
      .eq("id", userId)
      .single();

    if (userError) throw userError;

    // Determine the other user to notify
    const otherUserId = userId === ride.requester_id ? ride.accepter_id : ride.requester_id;

    if (otherUserId) {
      // Send notification to the other user
      await sendImmediateNotification(
        otherUserId,
        "Ride Completed",
        `${user.name} has marked the ride from ${ride.from_location} to ${ride.to_location} as completed`
      );

      // Create a notification in the database
      const { error: notificationError } = await supabase.from("notifications").insert({
        user_id: otherUserId,
        message: `${user.name} has marked the ride from ${ride.from_location} to ${ride.to_location} as completed`,
        type: "rideCompleted",
        related_id: rideId,
      });

      if (notificationError) throw notificationError;
    }

    return NextResponse.json({ ride: updatedRide });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
