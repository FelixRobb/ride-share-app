import { NextResponse } from "next/server"
import { supabase } from "@/lib/db"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const userId = url.searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 })
  }

  try {
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError) throw userError

    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("*, user:users!contacts_user_id_fkey(*), contact:users!contacts_contact_id_fkey(*)")
      .or(`user_id.eq.${userId},contact_id.eq.${userId}`)

    if (contactsError) throw contactsError

    return NextResponse.json(
      { user, contacts },
      {
        status: 200,
        headers: {
          ETag: new Date().getTime().toString(),
          "Cache-Control": "no-cache",
        },
      },
    )
  } catch (error) {
    console.error("Error fetching user data for ride form:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

