import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    // Get total bug reports count
    const { count: totalBugs, error: totalError } = await supabase.from("bug_reports").select("*", { count: "exact" });

    if (totalError) {
      return NextResponse.json(
        { error: "Failed to count bug reports" },
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

    // Get open bugs count (new + in_progress)
    const { count: openBugs, error: openError } = await supabase.from("bug_reports").select("*", { count: "exact" }).in("status", ["new", "in_progress"]);

    if (openError) {
      return NextResponse.json(
        { error: "Failed to count open bug reports" },
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

    // Get bugs by severity
    const { data: severityData, error: severityError } = await supabase.rpc("count_bug_reports_by_severity");

    if (severityError) {
      // Fallback if RPC function doesn't exist
      const { data: fallbackSeverityData, error: fallbackError } = await supabase.from("bug_reports").select("severity");

      if (fallbackError) {
        return NextResponse.json(
          { error: "Failed to get severity stats" },
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

      // Calculate severity counts manually
      const severityCounts = fallbackSeverityData.reduce(
        (acc, item) => {
          const severity = item.severity;
          acc[severity] = (acc[severity] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const bySeverity = Object.entries(severityCounts).map(([severity, count]) => ({
        severity,
        count,
      }));

      // Get bugs by status
      const { data: statusData, error: statusError } = await supabase.from("bug_reports").select("status");

      if (statusError) {
        return NextResponse.json(
          { error: "Failed to get status stats" },
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

      // Calculate status counts manually
      const statusCounts = statusData.reduce(
        (acc, item) => {
          const status = item.status;
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const byStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      }));

      return NextResponse.json(
        {
          totalBugs: totalBugs || 0,
          openBugs: openBugs || 0,
          bySeverity,
          byStatus,
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
    }

    // Get bugs by status
    const { data: statusData, error: statusError } = await supabase.rpc("count_bug_reports_by_status");

    if (statusError) {
      return NextResponse.json({ error: "Failed to get status stats" }, { status: 500 });
    }

    return NextResponse.json(
      {
        totalBugs: totalBugs || 0,
        openBugs: openBugs || 0,
        bySeverity: severityData || [],
        byStatus: statusData || [],
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
