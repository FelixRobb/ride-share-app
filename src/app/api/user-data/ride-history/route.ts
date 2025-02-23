import { NextResponse } from "next/server"
import { supabase } from "@/lib/db"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const userId = url.searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 })
  }

  try {
    const { data: rides, error: ridesError } = await supabase
      .from("rides")
      .select("*")
      .or(`requester_id.eq.${userId},accepter_id.eq.${userId}`)
      .order("time", { ascending: false })
      .limit(50) // Adjust this limit as needed

    if (ridesError) throw ridesError

    return NextResponse.json(
      { rides },
      {
        status: 200,
        headers: {
          ETag: new Date().getTime().toString(),
          "Cache-Control": "no-cache",
        },
      },
    )
  } catch (error) {
    console.error("Error fetching ride history data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

