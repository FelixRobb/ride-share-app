import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    // 1. Get the user's accepted and pending contacts
    const { data: userContacts, error: userContactsError } = await supabase.from("contacts").select("user_id, contact_id, status").or(`user_id.eq.${userId},contact_id.eq.${userId}`);

    if (userContactsError) throw userContactsError;

    // Extract the IDs of the user's contacts (both accepted and pending)
    const userContactIds = userContacts.flatMap((contact) => [contact.user_id, contact.contact_id]);
    const uniqueUserContactIds = Array.from(new Set(userContactIds)).filter((id) => id !== userId);

    // 2. Find contacts of contacts (potential mutual contacts)
    const { data: contactsOfContacts, error: contactsOfContactsError } = await supabase
      .from("contacts")
      .select("user_id, contact_id")
      .eq("status", "accepted")
      .or(`user_id.in.(${uniqueUserContactIds.join(",")}),contact_id.in.(${uniqueUserContactIds.join(",")})`);

    if (contactsOfContactsError) throw contactsOfContactsError;

    // 3. Identify mutual contacts
    const mutualContactIds = contactsOfContacts.flatMap((contact) => [contact.user_id, contact.contact_id]).filter((id) => id !== userId && !uniqueUserContactIds.includes(id));

    const uniqueMutualContactIds = Array.from(new Set(mutualContactIds));

    // 4. Fetch suggested user details
    const { data: suggestedUsers, error: suggestedUsersError } = await supabase.from("users").select("*").in("id", uniqueMutualContactIds);

    if (suggestedUsersError) throw suggestedUsersError;

    // 5. Add mutual contacts count
    const suggestedContacts = suggestedUsers.map((user) => ({
      ...user,
      mutual_contacts: mutualContactIds.filter((id) => id === user.id).length,
    }));

    // 6. Sort suggestions by mutual contacts count
    suggestedContacts.sort((a, b) => b.mutual_contacts - a.mutual_contacts);

    return NextResponse.json({ suggestedContacts });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
