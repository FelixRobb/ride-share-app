import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = session.user.id;

    const rideId = req.nextUrl.searchParams.get("rideId");

    if (!rideId) {
      return new NextResponse(
        JSON.stringify({ error: "Ride ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
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
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      throw error;
    }

    return new NextResponse(JSON.stringify({ ride }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
