import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { sendImmediateNotification } from "@/lib/pushNotificationService";

export async function POST(request: Request) {
  const { userId } = await request.json();

  const url = new URL(request.url);
  const rideId = url.pathname.split("/").at(-2);

  try {
    const { data: ride, error: rideError } = await supabase.from("rides").select("*").eq("id", rideId).eq("requester_id", userId).single();

    if (rideError || !ride) {
      return NextResponse.json({ error: "Ride not found or you are not the requester" }, { status: 404 });
    }

    const { data: updatedRide, error: updateError } = await supabase.from("rides").update({ status: "cancelled" }).eq("id", rideId).select().single();

    if (updateError) throw updateError;

    if (ride.accepter_id) {
      // Fetch the requester's name
      const { data: requester, error: requesterError } = await supabase.from("users").select("name").eq("id", userId).single();

      if (requesterError) throw requesterError;

      await sendImmediateNotification(ride.accepter_id, "Ride Cancelled", `The ride you accepted has been cancelled by ${requester.name}`);
      await supabase.from("notifications").insert({
        user_id: ride.accepter_id,
        message: `The ride you accepted has been cancelled by ${requester.name}`,
        type: "rideCancelled",
        related_id: rideId,
      });
    }

    return NextResponse.json({ ride: updatedRide });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
