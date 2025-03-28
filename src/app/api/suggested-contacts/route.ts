import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const session = await getServerSession(authOptions);
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
    });
  }

  const userId = session.user.id;

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

    return NextResponse.json(
      { suggestedContacts },
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        },
      }
    );
  }
}
