import { NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function DELETE(request: Request) {
  const url = new URL(request.url)
  const contactId = url.pathname.split("/").at(-1)

  if (!contactId) {
    return NextResponse.json({ error: "Contact ID is required" }, { status: 400 })
  }

  // Verify the user is authorized to delete this contact
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  try {
    // First, get the contact record to identify both users
    const { data: contactData, error: contactError } = await supabase
      .from("contacts")
      .select("user_id, contact_id, status")
      .eq("id", contactId)
      .single()

    if (contactError || !contactData) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    // Verify the requesting user is part of this contact
    if (contactData.user_id !== userId && contactData.contact_id !== userId) {
      return NextResponse.json({ error: "Unauthorized to delete this contact" }, { status: 403 })
    }

    const { user_id, contact_id } = contactData

    // Get the other user's ID (the one who is not the current user)
    const otherUserId = user_id === userId ? contact_id : user_id

    // Track what we've deleted for the response
    const deletedData = {
      rides: 0,
      notes: 0,
      notifications: 0,
      contact: false,
    }

    // 1. Find all rides between these two users - using a proper filter syntax
    const { data: rides, error: ridesError } = await supabase
      .from("rides")
      .select("id")
      .or(`requester_id.eq.${userId},accepter_id.eq.${userId}`)
      .or(`requester_id.eq.${otherUserId},accepter_id.eq.${otherUserId}`)

    if (ridesError) {
      console.error("Failed to fetch rides:", ridesError)
      return NextResponse.json({ error: `Failed to fetch rides: ${ridesError.message}` }, { status: 500 })
    }

    // If we found rides, we need to verify they involve both users
    if (rides && rides.length > 0) {
      // Get detailed ride information to filter properly
      const { data: detailedRides, error: detailedRidesError } = await supabase
        .from("rides")
        .select("id, requester_id, accepter_id")
        .in(
          "id",
          rides.map((r) => r.id),
        )

      if (detailedRidesError) {
        console.error("Failed to fetch detailed rides:", detailedRidesError)
        return NextResponse.json(
          { error: `Failed to fetch detailed rides: ${detailedRidesError.message}` },
          { status: 500 },
        )
      }

      // Now filter to only include rides where both users are involved
      const sharedRideIds =
        detailedRides
          ?.filter(
            (ride) =>
              (ride.requester_id === userId && ride.accepter_id === otherUserId) ||
              (ride.requester_id === otherUserId && ride.accepter_id === userId),
          )
          .map((ride) => ride.id) || []

      // 2. If there are shared rides, delete associated data
      if (sharedRideIds.length > 0) {
        deletedData.rides = sharedRideIds.length

        // 2a. Delete ride notes
        const { data: deletedNotes, error: notesError } = await supabase
          .from("ride_notes")
          .delete()
          .in("ride_id", sharedRideIds)
          .select("id")

        if (notesError) {
          console.error("Failed to delete ride notes:", notesError)
          return NextResponse.json({ error: `Failed to delete ride notes: ${notesError.message}` }, { status: 500 })
        }

        deletedData.notes = deletedNotes?.length || 0

        // 2b. Delete notifications related to these rides
        const { data: deletedRideNotifications, error: notificationsError } = await supabase
          .from("notifications")
          .delete()
          .in("related_id", sharedRideIds)
          .select("id")

        if (notificationsError) {
          console.error("Failed to delete ride notifications:", notificationsError)
          return NextResponse.json(
            { error: `Failed to delete notifications: ${notificationsError.message}` },
            { status: 500 },
          )
        }

        deletedData.notifications += deletedRideNotifications?.length || 0

        // 2c. Delete the rides themselves
        const { error: deleteRidesError } = await supabase.from("rides").delete().in("id", sharedRideIds)

        if (deleteRidesError) {
          console.error("Failed to delete rides:", deleteRidesError)
          return NextResponse.json({ error: `Failed to delete rides: ${deleteRidesError.message}` }, { status: 500 })
        }
      }
    }

    // 4. Delete the contact record
    const { error: deleteContactError } = await supabase.from("contacts").delete().eq("id", contactId)

    if (deleteContactError) {
      console.error("Failed to delete contact:", deleteContactError)
      return NextResponse.json({ error: `Failed to delete contact: ${deleteContactError.message}` }, { status: 500 })
    }

    deletedData.contact = true

    // 5. Delete the reverse contact record if it exists (for accepted contacts)
    if (contactData.status === "accepted") {
      const { error: reverseContactError } = await supabase
        .from("contacts")
        .delete()
        .eq("user_id", otherUserId)
        .eq("contact_id", userId)

      if (reverseContactError) {
        console.error("Failed to delete reverse contact:", reverseContactError)
        // We don't return an error here as the main contact was deleted successfully
      }
    }

    return NextResponse.json({
      success: true,
      deletedData,
    })
  } catch (error) {
    console.error("Error deleting contact and related data:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}

