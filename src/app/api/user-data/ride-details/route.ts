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
      return new NextResponse(JSON.stringify({ error: "Ride ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Fetch the ride details
    const { data: ride, error: rideError } = await supabase.from("rides").select("*").eq("id", rideId).single()

    if (rideError) {
      console.error("Error fetching ride:", rideError)
      return new NextResponse(JSON.stringify({ error: "Failed to fetch ride details" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Check if user has permission to view this ride
    let hasPermission = false

    // Direct involvement check - user is requester or accepter
    if (ride.requester_id === userId || ride.accepter_id === userId) {
      hasPermission = true
    }

    // If not directly involved, check contact relationships
    if (!hasPermission && (ride.requester_id || ride.accepter_id)) {
      try {
        // Check if user has a contact relationship with the requester
        if (ride.requester_id) {
          const { data: requesterContacts, error: requesterError } = await supabase
            .from("contacts")
            .select("*")
            .or(
              `(user_id.eq.${userId}.and.contact_id.eq.${ride.requester_id}),(contact_id.eq.${userId}.and.user_id.eq.${ride.requester_id})`,
            )
            .eq("status", "accepted")

          if (!requesterError && requesterContacts && requesterContacts.length > 0) {
            hasPermission = true
          }
        }

        // If still no permission and there's an accepter, check that relationship
        if (!hasPermission && ride.accepter_id) {
          const { data: accepterContacts, error: accepterError } = await supabase
            .from("contacts")
            .select("*")
            .or(
              `(user_id.eq.${userId}.and.contact_id.eq.${ride.accepter_id}),(contact_id.eq.${userId}.and.user_id.eq.${ride.accepter_id})`,
            )
            .eq("status", "accepted")

          if (!accepterError && accepterContacts && accepterContacts.length > 0) {
            hasPermission = true
          }
        }
      } catch (contactError) {
        console.error("Error checking contacts:", contactError)
        // Continue with hasPermission = false
      }
    }

    // If user doesn't have permission, return a forbidden error
    if (!hasPermission) {
      return new NextResponse(
        JSON.stringify({
          error: "You don't have permission to view this ride",
          permissionDenied: true,
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // If user has permission, fetch contacts and return the data
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
      console.error("Error fetching contacts:", contactsError)
      return new NextResponse(JSON.stringify({ error: "Failed to fetch contact information" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new NextResponse(JSON.stringify({ ride, contacts }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Unhandled error in ride-details API:", error)
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

