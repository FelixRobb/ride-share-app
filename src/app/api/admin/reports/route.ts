import { NextResponse } from "next/server";

import { supabase } from "@/lib/db";

export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const status = searchParams.get("status") || "";
    const pageSize = 10;
    const offset = (page - 1) * pageSize;

    // Build query
    let query = supabase
      .from("reports")
      .select(
        `
        *,
        reporter:reporter_id(name),
        reported:reported_id(name)
      `
      )
      .order("created_at", { ascending: false });

    // Apply status filter if provided
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from("reports")
      .select("*", { count: "exact" });

    if (countError) {
      return NextResponse.json({ error: "Failed to count reports" }, { status: 500 });
    }

    // Get paginated results
    const { data: reports, error } = await query.range(offset, offset + pageSize - 1);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
    }

    // Format reports for frontend
    const formattedReports = reports.map((report) => ({
      ...report,
      reporter_name: report.reporter?.name || "Unknown",
      reported_name: report.reported?.name || "Unknown",
    }));

    return NextResponse.json({
      reports: formattedReports,
      pagination: {
        page,
        pageSize,
        totalItems: totalCount ?? 0,
        totalPages: Math.ceil((totalCount ?? 0) / pageSize),
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
