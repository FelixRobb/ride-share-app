import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { getUserContacts } from "@/lib/contactService";
import { supabase } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    // 1. Get ALL contacts of the current user (both accepted and pending)
    // We need this to exclude them from suggestions later
    const { data: allUserContacts, error: allUserContactsError } = await getUserContacts(userId);

    if (allUserContactsError) throw allUserContactsError;

    // Extract all contact IDs (both accepted and pending)
    const allContactIds = allUserContacts.map((contact) =>
      contact.user_id === userId ? contact.contact_id : contact.user_id
    );

    // 2. Get ONLY ACCEPTED contacts of the current user
    const acceptedContacts = allUserContacts.filter((contact) => contact.status === "accepted");

    // Extract the IDs of the user's accepted contacts
    const acceptedContactIds = acceptedContacts.map((contact) =>
      contact.user_id === userId ? contact.contact_id : contact.user_id
    );

    if (acceptedContactIds.length === 0) {
      // If the user has no accepted contacts, return an empty array
      return NextResponse.json(
        { suggestedContacts: [] },
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
    }

    // 3. Find contacts of the user's accepted contacts (potential mutual contacts)
    const { data: contactsOfContacts, error: contactsOfContactsError } = await supabase
      .from("contacts")
      .select("user_id, contact_id")
      .eq("status", "accepted")
      .or(
        `user_id.in.(${acceptedContactIds.join(",")}),contact_id.in.(${acceptedContactIds.join(",")})`
      );

    if (contactsOfContactsError) throw contactsOfContactsError;

    // 4. Identify potential contacts (contacts of contacts)
    const potentialContactIds = contactsOfContacts
      .flatMap((contact) => [contact.user_id, contact.contact_id])
      .filter(
        (id) =>
          id !== userId && // Not the current user
          !acceptedContactIds.includes(id) && // Not already an accepted contact
          !allContactIds.includes(id) // Not already any kind of contact (accepted or pending)
      );

    const uniquePotentialContactIds = Array.from(new Set(potentialContactIds));

    if (uniquePotentialContactIds.length === 0) {
      // If there are no potential contacts, return an empty array
      return NextResponse.json(
        { suggestedContacts: [] },
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
    }

    // 5. Fetch suggested user details
    const { data: suggestedUsers, error: suggestedUsersError } = await supabase
      .from("users")
      .select("*")
      .in("id", uniquePotentialContactIds);

    if (suggestedUsersError) throw suggestedUsersError;

    // 6. Calculate mutual contacts count for each suggested user
    const suggestedContacts = suggestedUsers.map((user) => {
      // Find all instances where this user appears in contactsOfContacts
      const mutualContactsCount = contactsOfContacts.filter(
        (contact) =>
          (contact.user_id === user.id || contact.contact_id === user.id) &&
          (acceptedContactIds.includes(contact.user_id) ||
            acceptedContactIds.includes(contact.contact_id))
      ).length;

      return {
        ...user,
        mutual_contacts: mutualContactsCount,
      };
    });

    // 7. Sort suggestions by mutual contacts count (highest first)
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
