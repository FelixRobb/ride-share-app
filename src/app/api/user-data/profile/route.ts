import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
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

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError) throw userError;

    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select(
        `
      *,
      user:users!contacts_user_id_fkey (id, name, phone),
      contact:users!contacts_contact_id_fkey (id, name, phone)
    `
      )
      .or(`user_id.eq.${userId},contact_id.eq.${userId}`);

    if (contactsError) throw contactsError;

    const { data: associatedPeople, error: associatedPeopleError } = await supabase
      .from("associated_people")
      .select("*")
      .eq("user_id", userId);

    if (associatedPeopleError) throw associatedPeopleError;

    // Generate response data
    const responseData = { user: userData, contacts, associatedPeople };

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
