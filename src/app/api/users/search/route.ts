import { NextResponse } from "next/server"
import { supabase } from "@/lib/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")
  const currentUserId = searchParams.get("currentUserId")

  if (!query || !currentUserId) {
    return NextResponse.json({ error: "Missing query or currentUserId" }, { status: 400 })
  }

  try {
    // Search for users by name or phone number (partial matches)
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, phone")
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
      .neq("id", currentUserId)
      .limit(7)

    if (usersError) throw usersError

    // Fetch all contacts for the current user (both ways)
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("*")
      .or(`user_id.eq.${currentUserId},contact_id.eq.${currentUserId}`)

    if (contactsError) throw contactsError

    // Process users and add contact status
    const processedUsers = users.map((user) => {
      const contact = contacts.find(
        (c) =>
          (c.user_id === currentUserId && c.contact_id === user.id) ||
          (c.contact_id === currentUserId && c.user_id === user.id),
      )

      return {
        ...user,
        contactStatus: contact ? contact.status : null,
        contactId: contact ? contact.id : null,
      }
    })

    return NextResponse.json({ users: processedUsers })
  } catch (error) {
    console.error("Search users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

