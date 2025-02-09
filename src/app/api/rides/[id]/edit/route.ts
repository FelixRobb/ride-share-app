import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import type { RideData } from "@/types";

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const rideId = params.id;
  const { userId, ...updatedRideData }: RideData & { userId: string } = await request.json();

  try {
    // Fetch the current ride data
    const { data: currentRide, error: fetchError } = await supabase.from("rides").select("*").eq("id", rideId).single();

    if (fetchError) throw fetchError;

    // Check if the user is the requester and the ride is pending
    if (currentRide.requester_id !== userId || currentRide.status !== "pending") {
      return NextResponse.json({ error: "Unauthorized or ride is not editable" }, { status: 403 });
    }

    // Update the ride
    const { data: updatedRide, error: updateError } = await supabase
      .from("rides")
      .update({ ...updatedRideData, is_edited: true })
      .eq("id", rideId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ ride: updatedRide });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
