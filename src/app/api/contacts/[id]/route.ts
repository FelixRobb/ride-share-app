import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const contactId = url.pathname.split("/").at(-1);

  if (!contactId) {
    return NextResponse.json({ error: "Contact ID is required" }, { status: 400 });
  }

  // Verify the user is authorized to delete this contact
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // First, get the contact record to identify both users
    const { data: contactData, error: contactError } = await supabase.from("contacts").select("user_id, contact_id, status").eq("id", contactId).single();

    if (contactError || !contactData) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Verify the requesting user is part of this contact
    if (contactData.user_id !== userId && contactData.contact_id !== userId) {
      return NextResponse.json({ error: "Unauthorized to delete this contact" }, { status: 403 });
    }

    const { user_id, contact_id, status } = contactData;

    // Get the other user's ID (the one who is not the current user)
    const otherUserId = user_id === userId ? contact_id : user_id;

    // Track what we've deleted for the response
    const deletedData = {
      rides: 0,
      notes: 0,
      contact: false,
    };

    // Only delete shared rides and related data if this is an accepted contact
    if (status === "accepted") {
      // 1. Find all rides between these two users
      const { data: sharedRides, error: ridesError } = await supabase
        .from("rides")
        .select("id")
        .or(`and(requester_id.eq.${userId},accepter_id.eq.${otherUserId}),` + `and(requester_id.eq.${otherUserId},accepter_id.eq.${userId})`);

      if (ridesError) {
        return NextResponse.json({ error: `Failed to fetch shared rides: ${ridesError.message}` }, { status: 500 });
      }

      // If there are shared rides, delete associated data
      if (sharedRides && sharedRides.length > 0) {
        const rideIds = sharedRides.map((ride) => ride.id);
        deletedData.rides = rideIds.length;

        // 2a. Delete ride notes for these rides
        const { data: deletedNotes, error: notesError } = await supabase.from("ride_notes").delete().in("ride_id", rideIds).select("id");

        if (notesError) {
          return NextResponse.json({ error: `Failed to delete ride notes: ${notesError.message}` }, { status: 500 });
        }

        deletedData.notes = deletedNotes?.length || 0;

        // 2c. Delete the rides themselves
        const { error: deleteRidesError } = await supabase.from("rides").delete().in("id", rideIds);

        if (deleteRidesError) {
          return NextResponse.json({ error: `Failed to delete rides: ${deleteRidesError.message}` }, { status: 500 });
        }
      }
    }

    // 4. Delete the contact record
    const { error: deleteContactError } = await supabase.from("contacts").delete().eq("id", contactId);

    if (deleteContactError) {
      return NextResponse.json({ error: `Failed to delete contact: ${deleteContactError.message}` }, { status: 500 });
    }

    deletedData.contact = true;

    return NextResponse.json({
      success: true,
      deletedData,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
