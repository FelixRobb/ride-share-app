import { NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !session.user.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        },
      })
    }

    const userId = session.user.id

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

    if (contactsError) throw contactsError

    // Extract connected user IDs (only for accepted contacts)
    const connectedUserIds = contacts
      .filter((contact) => contact.status === "accepted")
      .map((contact) => (contact.user_id === userId ? contact.contact_id : contact.user_id))

    // Fetch active rides and limited history
    const { data: rides, error: ridesError } = await supabase
      .from("rides")
      .select(
        `
        *,
        requester:users!rides_requester_id_fkey (id, name, phone),
        accepter:users!rides_accepter_id_fkey (id, name, phone)
      `,
      )
      .or(`requester_id.eq.${userId},accepter_id.eq.${userId},requester_id.in.(${connectedUserIds.join(",")})`)
      .or("status.eq.pending,status.eq.accepted,status.in.(completed,cancelled)")
      .order("created_at", { ascending: false })
      .limit(50)

    if (ridesError) throw ridesError

    return new NextResponse(JSON.stringify({ rides, contacts }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Surrogate-Control": "no-store",
      },
    })
  } catch {
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Surrogate-Control": "no-store",
      },
    })
  }
}

