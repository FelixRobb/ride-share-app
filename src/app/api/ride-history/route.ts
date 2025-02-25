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
    const limit = Number.parseInt(url.searchParams.get("limit") || String(ITEMS_PER_PAGE))
    const search = url.searchParams.get("search") || ""
    const status = url.searchParams.get("status") || ""
    const date = url.searchParams.get("date") || ""

    let query = supabase
      .from("rides")
      .select("*", { count: "exact" })
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

    // First, get the total count
    const { count, error: countError } = await query

    if (countError) {
      throw countError
    }

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)
    const safePageNumber = Math.min(Math.max(1, page), totalPages || 1)
    const offset = (safePageNumber - 1) * limit

    // Now fetch the actual data
    const { data: rides, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return NextResponse.json({
      rides,
      total: totalCount,
      page: safePageNumber,
      totalPages,
    })
  } catch (error) {
    // Use a custom logger or error reporting service instead of console.log
    // For example: logger.error("Error fetching ride history:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

