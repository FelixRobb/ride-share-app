import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const reportId = params.id;

    // Get request body
    const { status, adminNotes } = await request.json();

    // Validate status
    if (!status || !["pending", "reviewed", "resolved", "dismissed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Check if report exists
    const { data: existingReport, error: reportError } = await supabase.from("reports").select("*").eq("id", reportId).single();

    if (reportError || !existingReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Update report
    const { data: updatedReport, error } = await supabase
      .from("reports")
      .update({
        status,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
    }

    return NextResponse.json({ success: true, report: updatedReport });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const reportId = params.id;

    // Get report details
    const { data: report, error } = await supabase
      .from("reports")
      .select(
        `
        *,
        reporter:reporter_id(name, email, phone),
        reported:reported_id(name, email, phone),
        ride:ride_id(*)
      `
      )
      .eq("id", reportId)
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
    }

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ report });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
