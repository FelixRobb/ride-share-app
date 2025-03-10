import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import type { User, Contact } from "@/types";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!userId || !query) {
    return NextResponse.json(
      { error: "Missing query or userId" },
      { status: 400 }
    );
  }

  try {
    // Search for users by name or phone number (partial matches)
    // Using unaccent to ignore accents and diacritical marks
    const { data: users, error: usersError } = await supabase.rpc(
      "search_users_with_unaccent",
      {
        search_query: query.toLowerCase(),
        current_user_id: userId,
        limit_count: 7,
      }
    );

    if (usersError) {
      throw usersError;
    }

    // Fetch all contacts for the current user (both ways)
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("*")
      .or(`user_id.eq.${userId},contact_id.eq.${userId}`);

    if (contactsError) {
      throw contactsError;
    }

    const processedUsers: (User & {
      contactStatus: string | null;
      contactId: string | null;
    })[] = users.map((user: User) => {
      const contact: Contact | undefined = contacts.find(
        (c: Contact) =>
          (c.user_id === userId && c.contact_id === user.id) ||
          (c.contact_id === userId && c.user_id === user.id)
      );

      return {
        ...user,
        contactStatus: contact ? contact.status : null,
        contactId: contact ? contact.id : null,
      };
    });

    return NextResponse.json({ users: processedUsers });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
