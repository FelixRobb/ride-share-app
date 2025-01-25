import { NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import type { User } from "@/types"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 })
  }

  try {

    // 1. Get the user's accepted contacts
    const { data: userContacts, error: userContactsError } = await supabase
      .from("contacts")
      .select("user_id, contact_id")
      .or(`user_id.eq.${userId},contact_id.eq.${userId}`)
      .eq("status", "accepted")

    if (userContactsError) throw userContactsError

    // Extract the IDs of the user's contacts
    const userContactIds = userContacts.map((contact) =>
      contact.user_id === userId ? contact.contact_id : contact.user_id,
    )

    // 2. Find contacts of contacts (potential mutual contacts)
    const { data: contactsOfContacts, error: contactsOfContactsError } = await supabase
      .from("contacts")
      .select("user_id, contact_id")
      .or(`user_id.in.(${userContactIds.join(",")}),contact_id.in.(${userContactIds.join(",")})`)
      .eq("status", "accepted")

    if (contactsOfContactsError) throw contactsOfContactsError

    // 3. Identify mutual contacts
    const mutualContactIds = contactsOfContacts
      .flatMap((contact) => [contact.user_id, contact.contact_id])
      .filter((id) => id !== userId && !userContactIds.includes(id))

    const uniqueMutualContactIds = Array.from(new Set(mutualContactIds))

    // 4. Fetch suggested user details
    const { data: suggestedUsers, error: suggestedUsersError } = await supabase
      .from("users")
      .select("*")
      .in("id", uniqueMutualContactIds)

    if (suggestedUsersError) throw suggestedUsersError

    // 5. Add mutual contacts count
    const suggestedContacts = suggestedUsers.map((user) => ({
      ...user,
      mutual_contacts: mutualContactIds.filter((id) => id === user.id).length,
    }))

    // 6. Sort suggestions by mutual contacts count
    suggestedContacts.sort((a, b) => b.mutual_contacts - a.mutual_contacts)

    return NextResponse.json({ suggestedContacts })
  } catch (error) {
    console.error("Error fetching suggested contacts:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

