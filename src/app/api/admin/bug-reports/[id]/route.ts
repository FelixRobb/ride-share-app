import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const bugReportId = params.id;

    // Get request body
    const { status, adminNotes } = await request.json();

    // Validate status
    if (!status || !["new", "in_progress", "resolved", "closed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Check if bug report exists
    const { data: existingReport, error: reportError } = await supabase.from("bug_reports").select("*").eq("id", bugReportId).single();

    if (reportError || !existingReport) {
      return NextResponse.json({ error: "Bug report not found" }, { status: 404 });
    }

    // Update bug report
    const { data: updatedReport, error } = await supabase
      .from("bug_reports")
      .update({
        status,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bugReportId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update bug report" }, { status: 500 });
    }

    // Notify user about the status change

    await supabase.from("notifications").insert({
      user_id: existingReport.user_id,
      message: `Your bug report "${existingReport.title}" has been updated to ${status}`,
      type: "bug_report_update",
      is_read: false,
    });

    return NextResponse.json({ success: true, bugReport: updatedReport });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request, props: { params: { id: string } }) {
  try {
    const params = props.params;
    const bugReportId = params.id;

    // Get bug report details
    const { data: bugReport, error } = await supabase
      .from("bug_reports")
      .select(
        `
        *,
        user:user_id(name, email, phone)
      `
      )
      .eq("id", bugReportId)
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to fetch bug report" }, { status: 500 });
    }

    if (!bugReport) {
      return NextResponse.json({ error: "Bug report not found" }, { status: 404 });
    }

    return NextResponse.json({ bugReport });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
