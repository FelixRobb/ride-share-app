import { NextResponse } from "next/server";

import { supabase } from "@/lib/db";
import { sendImmediateNotification } from "@/lib/pushNotificationService";

export async function POST(request: Request) {
  const { userId } = await request.json();

  const url = new URL(request.url);
  const rideId = url.pathname.split("/").at(-2);

  try {
    const { data: ride, error: rideError } = await supabase
      .from("rides")
      .select("*")
      .eq("id", rideId)
      .single();

    if (rideError || !ride) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }

    if (ride.status !== "pending") {
      return NextResponse.json({ error: "Ride is not available" }, { status: 400 });
    }

    const { data: updatedRide, error: updateError } = await supabase
      .from("rides")
      .update({ accepter_id: userId, status: "accepted" })
      .eq("id", rideId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Fetch the current user's name
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("name")
      .eq("id", userId)
      .single();

    if (userError) throw userError;

    await sendImmediateNotification(
      ride.requester_id,
      "Ride Accepted",
      `Your ride request from ${ride.from_location} to ${ride.to_location} has been accepted by ${currentUser.name}`
    );
    await supabase.from("notifications").insert({
      user_id: ride.requester_id,
      message: `Your ride request from ${ride.from_location} to ${ride.to_location} has been accepted by ${currentUser.name}`,
      type: "rideAccepted",
      related_id: rideId,
    });

    return NextResponse.json({ ride: updatedRide });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
