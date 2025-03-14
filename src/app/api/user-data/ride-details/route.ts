import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !session.user.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const userId = session.user.id

    const rideId = req.nextUrl.searchParams.get("rideId")

    if (!rideId) {
      return new NextResponse(JSON.stringify({ error: "Ride ID is required", message: "Ride ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { data: ride, error: rideError } = await supabase.from("rides").select("*").eq("id", rideId).single()

    // Handle case where ride doesn't exist
    if (rideError) {
      // PostgreSQL error code for "no rows returned" or empty result
      if (rideError.code === "PGRST116" || rideError.message?.includes("no rows returned")) {
        return new NextResponse(
          JSON.stringify({
            error: "not_found",
            message: "The requested ride could not be found. It may have been deleted or never existed.",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      return new NextResponse(
        JSON.stringify({
          error: "database_error",
          message: "An error occurred while retrieving the ride information.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Query contacts before checking permissions
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select(
        `
      *,
      user:users!contacts_user_id_fkey (id, name, phone),
      contact:users!contacts_contact_id_fkey (id, name, phone)
    `,
      )
      .or(`user_id.eq.${userId},contact_id.eq.${userId}`)

    if (contactsError) {
      return new NextResponse(
        JSON.stringify({
          error: "database_error",
          message: "An error occurred while retrieving contact information.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Check permissions based on the requirements
    // 1. If the user is the requester, they can always see the ride
    if (ride.requester_id === userId) {
      // Requester can always see their own rides
    }
    // 2. If the ride is pending, only accepted contacts of the requester can see it
    else if (ride.status === "pending") {
      // Check if the user is an accepted contact of the requester
      const isAcceptedContactOfRequester = contacts.some(
        (contact) =>
          (contact.user_id === ride.requester_id && contact.contact_id === userId && contact.status === "accepted") ||
          (contact.user_id === userId && contact.contact_id === ride.requester_id && contact.status === "accepted"),
      )

      if (!isAcceptedContactOfRequester) {
        return new NextResponse(
          JSON.stringify({
            error: "permission_denied",
            message: "You do not have permission to view this ride",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          },
        )
      }
    }
    // 3. If the ride is accepted/cancelled/completed, only the requester and accepter can see it
    else if (["accepted", "cancelled", "completed"].includes(ride.status)) {
      if (ride.requester_id !== userId && ride.accepter_id !== userId) {
        return new NextResponse(
          JSON.stringify({
            error: "permission_denied",
            message: "You do not have permission to view this ride",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          },
        )
      }
    }

    return new NextResponse(JSON.stringify({ ride, contacts }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch {
    return new NextResponse(
      JSON.stringify({
        error: "server_error",
        message: "An unexpected error occurred. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

