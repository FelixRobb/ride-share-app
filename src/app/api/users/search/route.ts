import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

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
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, phone")
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
      .neq("id", userId)
      .limit(7);

    if (usersError) throw usersError;

    // Fetch all contacts for the current user (both ways)
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("*")
      .or(`user_id.eq.${userId},contact_id.eq.${userId}`);

    if (contactsError) throw contactsError;

    // Process users and add contact status
    const processedUsers = users.map((user) => {
      const contact = contacts.find(
        (c) =>
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
