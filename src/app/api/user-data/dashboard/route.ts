import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { getUserContacts } from "@/lib/contactService";
import { supabase } from "@/lib/db";
import { generateETag, isETagMatch } from "@/utils/etag";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
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

    const { data: contacts, error: contactsError } = await getUserContacts(userId);

    if (contactsError) throw contactsError;

    // Extract connected user IDs (only for accepted contacts)
    const connectedUserIds = contacts
      .filter((contact) => contact.status === "accepted")
      .map((contact) => (contact.user_id === userId ? contact.contact_id : contact.user_id));

    // Fetch active rides and limited history
    const { data: rides, error: ridesError } = await supabase
      .from("rides")
      .select(
        `
        *,
        requester:users!rides_requester_id_fkey (id, name, phone),
        accepter:users!rides_accepter_id_fkey (id, name, phone)
      `
      )
      .or(
        `requester_id.eq.${userId},accepter_id.eq.${userId},requester_id.in.(${connectedUserIds.join(",")})`
      )
      .or("status.eq.pending,status.eq.accepted,status.in.(completed,cancelled)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (ridesError) throw ridesError;

    // Generate response data
    const responseData = { rides, contacts };

    // Generate ETag for the response data
    const etag = generateETag(responseData);

    // Check if the client already has this version (ETag match)
    const ifNoneMatch = req.headers.get("if-none-match");
    if (isETagMatch(etag, ifNoneMatch)) {
      // Return 304 Not Modified if the content hasn't changed
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: `"${etag}"`,
          "Cache-Control": "public, max-age=0, must-revalidate",
        },
      });
    }

    return new NextResponse(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ETag: `"${etag}"`,
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    });
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
    });
  }
}
