import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { sendImmediateNotification } from "@/lib/pushNotificationService";

export async function POST(request: Request) {
  const { userId } = await request.json();

  const url = new URL(request.url);
  const rideId = url.pathname.split("/").at(-2);

  if (!userId || !rideId) {
    return NextResponse.json({ error: "Missing required data" }, { status: 400 });
  }

  try {
    const { data: ride, error: rideError } = await supabase.from("rides").select("*").eq("id", rideId).eq("accepter_id", userId).single();

    if (rideError || !ride) {
      return NextResponse.json({ error: "Ride not found or you are not the accepter" }, { status: 404 });
    }

    const { data: updatedRide, error: updateError } = await supabase.from("rides").update({ status: "pending", accepter_id: null }).eq("id", rideId).select().single();

    if (updateError) throw updateError;

    // Fetch the accepter's name
    const { data: accepter, error: accepterError } = await supabase.from("users").select("name").eq("id", userId).single();

    if (accepterError) throw accepterError;

    if (ride.requester_id) {
      await sendImmediateNotification(ride.requester_id, "Ride Offer Cancelled", `The accepted offer for your ride from ${ride.from_location} to ${ride.to_location} has been cancelled by ${accepter.name}`);

      await supabase.from("notifications").insert({
        user_id: ride.requester_id,
        message: `The accepted offer for your ride from ${ride.from_location} to ${ride.to_location} has been cancelled by ${accepter.name}`,
        type: "Ride Offer Cancelled",
        related_id: rideId,
      });
    }

    return NextResponse.json({ ride: updatedRide });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
