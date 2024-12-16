// app/api/user-data/route.ts
import { NextResponse } from "next/server";
import { supabase, logError } from "@/lib/db";
import crypto from "crypto";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  console.log("Received userId:", userId);

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    console.error("Invalid UUID format:", userId);
    return NextResponse.json({ error: "Invalid User ID format" }, { status: 400 });
  }

  try {
    // Fetch all contacts, regardless of status
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select(`
        *,
        user:users!contacts_user_id_fkey (id, name, phone),
        contact:users!contacts_contact_id_fkey (id, name, phone)
      `)
      .or(`user_id.eq.${userId},contact_id.eq.${userId}`);

    if (contactsError) throw contactsError;

    // Extract connected user IDs (only for accepted contacts)
    const connectedUserIds = contacts
      .filter(contact => contact.status === 'accepted')
      .map(contact => 
        contact.user_id === userId ? contact.contact_id : contact.user_id
      );

    // Fetch rides
    const { data: rides, error: ridesError } = await supabase
      .from("rides")
      .select(`
        *,
        requester:users!rides_requester_id_fkey (id, name, phone),
        accepter:users!rides_accepter_id_fkey (id, name, phone)
      `)
      .or(`requester_id.eq.${userId},accepter_id.eq.${userId},requester_id.in.(${connectedUserIds.join(',')})`)
      .order('created_at', { ascending: false });

    if (ridesError) throw ridesError;

    // Fetch notifications
    const { data: notifications, error: notificationsError } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (notificationsError) throw notificationsError;

    // Fetch associated people
    const { data: associatedPeople, error: associatedPeopleError } = await supabase
      .from("associated_people")
      .select("*")
      .eq("user_id", userId);

    if (associatedPeopleError) throw associatedPeopleError;

    // Fetch user stats
    const { data: stats, error: statsError } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (statsError) throw statsError;

    // Prepare response data
    const data = { rides, contacts, notifications, associatedPeople, stats };
    const dataString = JSON.stringify(data);
    const etag = crypto.createHash("md5").update(dataString).digest("hex");

    // Check if the client has a valid cached version
    const ifNoneMatch = request.headers.get("If-None-Match");
    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304 });
    }

    // Return the full response with ETag
    return new Response(dataString, {
      headers: {
        "Content-Type": "application/json",
        ETag: etag,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    logError('user data fetch', error);
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 });
  }
}

