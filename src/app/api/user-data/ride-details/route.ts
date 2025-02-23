import { NextResponse } from "next/server"
import { supabase } from "@/lib/db"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const userId = url.searchParams.get("userId")
  const rideId = url.searchParams.get("rideId")

  if (!userId || !rideId) {
    return NextResponse.json({ error: "User ID and Ride ID are required" }, { status: 400 })
  }

  try {
    const { data: ride, error: rideError } = await supabase.from("rides").select("*").eq("id", rideId).single()

    if (rideError) throw rideError

    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("*, user:users!contacts_user_id_fkey(*), contact:users!contacts_contact_id_fkey(*)")
      .or(`user_id.eq.${userId},contact_id.eq.${userId}`)

    if (contactsError) throw contactsError

    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError) throw userError

    return NextResponse.json(
      { ride, contacts, user },
      {
        status: 200,
        headers: {
          ETag: new Date().getTime().toString(),
          "Cache-Control": "no-cache",
        },
      },
    )
  } catch (error) {
    console.error("Error fetching ride details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

