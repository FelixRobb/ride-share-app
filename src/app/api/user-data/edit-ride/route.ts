import { type NextRequest, NextResponse } from "next/server";
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

    const rideId = req.nextUrl.searchParams.get("rideId");

    if (!rideId) {
      return new NextResponse(JSON.stringify({ error: "Ride ID is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        },
      });
    }

    const { data: ride, error } = await supabase
      .from("rides")
      .select("*")
      .eq("id", rideId)
      .eq("requester_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return new NextResponse(
          JSON.stringify({
            error: "Ride not found or you don't have permission to edit",
          }),
          {
            status: 404,
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
      throw error;
    }

    // Generate response data
    const responseData = { ride };

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
