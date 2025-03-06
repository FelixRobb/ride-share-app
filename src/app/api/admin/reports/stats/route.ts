import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET() {
  try {
    // Get total reports count
    const { count: totalReports, error: totalError } = await supabase.from("reports").select("*", { count: "exact", head: true });

    if (totalError) {
      return NextResponse.json({ error: "Failed to count reports" }, { status: 500 });
    }

    // Get pending reports count
    const { count: pendingReports, error: pendingError } = await supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending");

    if (pendingError) {
      return NextResponse.json({ error: "Failed to count pending reports" }, { status: 500 });
    }

    // Get reports by type
    const { data: byType, error: typeError } = await supabase.rpc("count_reports_by_type");

    if (typeError) {
      // Fallback if RPC function doesn't exist
      const { data: manualTypeCount, error: manualTypeError } = await supabase.from("reports").select("report_type, count").select("report_type").order("report_type");

      if (manualTypeError) {
        return NextResponse.json({ error: "Failed to count reports by type" }, { status: 500 });
      }

      // Manually count by type
      const typeCount = manualTypeCount.reduce(
        (acc, report) => {
          const type = report.report_type;
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Convert to array format
      const byTypeArray = Object.entries(typeCount).map(([report_type, count]) => ({
        report_type,
        count,
      }));

      // Get reports by status
      const { data: statusData, error: statusError } = await supabase.from("reports").select("status");

      if (statusError) {
        return NextResponse.json({ error: "Failed to count reports by status" }, { status: 500 });
      }

      // Manually count by status
      const statusCount = statusData.reduce(
        (acc, report) => {
          const status = report.status;
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Convert to array format
      const byStatusArray = Object.entries(statusCount).map(([status, count]) => ({
        status,
        count,
      }));

      // Get reports by reason
      const { data: reasonData, error: reasonError } = await supabase.from("reports").select("reason");

      if (reasonError) {
        return NextResponse.json({ error: "Failed to count reports by reason" }, { status: 500 });
      }

      // Manually count by reason
      const reasonCount = reasonData.reduce(
        (acc, report) => {
          const reason = report.reason;
          acc[reason] = (acc[reason] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Convert to array format
      const byReasonArray = Object.entries(reasonCount).map(([reason, count]) => ({
        reason,
        count,
      }));

      return NextResponse.json({
        totalReports: totalReports || 0,
        pendingReports: pendingReports || 0,
        byType: byTypeArray,
        byStatus: byStatusArray,
        byReason: byReasonArray,
      });
    }

    // Get reports by status
    const { data: byStatus, error: statusError } = await supabase.rpc("count_reports_by_status");

    if (statusError) {
      return NextResponse.json({ error: "Failed to count reports by status" }, { status: 500 });
    }

    // Get reports by reason
    const { data: byReason, error: reasonError } = await supabase.rpc("count_reports_by_reason");

    if (reasonError) {
      return NextResponse.json({ error: "Failed to count reports by reason" }, { status: 500 });
    }

    return NextResponse.json({
      totalReports: totalReports || 0,
      pendingReports: pendingReports || 0,
      byType: byType || [],
      byStatus: byStatus || [],
      byReason: byReason || [],
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
