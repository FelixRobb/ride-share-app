import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const ITEMS_PER_PAGE = 10

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const search = url.searchParams.get("search") || ""
    const status = url.searchParams.get("status") || ""
    const date = url.searchParams.get("date") || ""
    const limit = Number.parseInt(url.searchParams.get("limit") || String(ITEMS_PER_PAGE))

    const offset = (page - 1) * ITEMS_PER_PAGE

    let query = supabase
      .from("rides")
      .select(
        `
        id,
        from_location,
        to_location,
        time,
        status,
        requester:users!rides_requester_id_fkey (id, name),
        accepter:users!rides_accepter_id_fkey (id, name)
      `,
        { count: "exact" },
      )
      .eq("requester_id", session.user.id)
      .order("time", { ascending: false })

    if (search) {
      query = query.or(`from_location.ilike.%${search}%,to_location.ilike.%${search}%`)
    }

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
      query = query.gte("time", startDate.toISOString()).lt("time", endDate.toISOString())
    }

    const { data: rides, count, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return NextResponse.json({
      rides,
      totalCount: count,
      hasMore: (count || 0) > offset + limit,
    })
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

