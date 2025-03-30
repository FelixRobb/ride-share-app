import { NextResponse } from "next/server";

import { supabase } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("count", { count: "exact" });

    const { data: rides, error: ridesError } = await supabase
      .from("rides")
      .select("count", { count: "exact" });

    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("count", { count: "exact" });

    if (usersError || ridesError || contactsError) {
      throw new Error("Error fetching statistics");
    }

    return NextResponse.json(
      {
        totalUsers: users[0].count,
        totalRides: rides[0].count,
        totalContacts: contacts[0].count,
      },
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
      { error: "Internal server error" },
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
