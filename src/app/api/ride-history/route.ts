import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { startOfDay, endOfDay, startOfYesterday, endOfYesterday, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export const dynamic = "force-dynamic";
export const revalidate = 0; // Disable caching

const ITEMS_PER_PAGE = 10;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        {
          status: 401,
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

    const url = new URL(req.url);
    const page = Number.parseInt(url.searchParams.get("page") || "1");
    const limit = Number.parseInt(url.searchParams.get("limit") || String(ITEMS_PER_PAGE));
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    const date = url.searchParams.get("date") || "";
    const timePeriod = url.searchParams.get("timePeriod") || "";

    let query = supabase.from("rides").select("*", { count: "exact" }).or(`requester_id.eq.${session.user.id},accepter_id.eq.${session.user.id}`).order("time", { ascending: false });

    // Apply search filter
    if (search) {
      query = query.or(`from_location.ilike.%${search}%,to_location.ilike.%${search}%,rider_name.ilike.%${search}%`);
    }

    // Apply status filter
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Apply date filters
    if (date) {
      // Custom date filter
      const selectedDate = new Date(date);
      const startDate = startOfDay(selectedDate);
      const endDate = endOfDay(selectedDate);
      query = query.gte("time", startDate.toISOString()).lt("time", endDate.toISOString());
    } else if (timePeriod) {
      // Predefined time period filters
      const now = new Date();

      switch (timePeriod) {
        case "today":
          query = query.gte("time", startOfDay(now).toISOString()).lt("time", endOfDay(now).toISOString());
          break;
        case "yesterday":
          query = query.gte("time", startOfYesterday().toISOString()).lt("time", endOfYesterday().toISOString());
          break;
        case "this-week":
          query = query.gte("time", startOfWeek(now, { weekStartsOn: 1 }).toISOString()).lt("time", endOfWeek(now, { weekStartsOn: 1 }).toISOString());
          break;
        case "this-month":
          query = query.gte("time", startOfMonth(now).toISOString()).lt("time", endOfMonth(now).toISOString());
          break;
      }
    }

    // First, get the total count
    const { count, error: countError } = await query;

    if (countError) {
      throw countError;
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const safePageNumber = Math.min(Math.max(1, page), totalPages || 1);
    const offset = (safePageNumber - 1) * limit;

    // Now fetch the actual data
    const { data: rides, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        rides,
        total: totalCount,
        page: safePageNumber,
        totalPages,
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
      { error: "Internal Server Error" },
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
