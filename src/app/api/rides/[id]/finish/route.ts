import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { sendImmediateNotification } from "@/lib/pushNotificationService";

export async function POST(request: Request) {
  const { userId } = await request.json();

  const url = new URL(request.url);
  const rideId = url.pathname.split("/").at(-2);

  try {
    const { data: ride, error: rideError } = await supabase.from("rides").select("*").eq("id", rideId).single();

    if (rideError || !ride) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }

    if (ride.status !== "accepted") {
      return NextResponse.json({ error: "Ride cannot be finished" }, { status: 400 });
    }

    if (ride.accepter_id !== userId && ride.requester_id !== userId) {
      return NextResponse.json({ error: "Unauthorized to finish this ride" }, { status: 403 });
    }

    const { data: updatedRide, error: updateError } = await supabase.from("rides").update({ status: "completed" }).eq("id", rideId).select().single();

    if (updateError) throw updateError;

    const otherUserId = userId === ride.requester_id ? ride.accepter_id : ride.requester_id;

    // Fetch the user's name who finished the ride
    const { data: finisher, error: finisherError } = await supabase.from("users").select("name").eq("id", userId).single();

    if (finisherError) throw finisherError;

    await sendImmediateNotification(otherUserId, "Ride Completed", `Your ride from ${ride.from_location} to ${ride.to_location} has been marked as completed by ${finisher.name}`);
    await supabase.from("notifications").insert({
      user_id: otherUserId,
      message: `Your ride from ${ride.from_location} to ${ride.to_location} has been marked as completed by ${finisher.name}`,
      type: "rideCompleted",
      related_id: rideId,
    });

    return NextResponse.json({ ride: updatedRide });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
