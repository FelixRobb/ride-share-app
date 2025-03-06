import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/db";
import type { BugReportFormData } from "@/types";

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const data: BugReportFormData = await request.json();

    // Validate required fields
    if (!data.title || !data.description || !data.severity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate description length
    if (data.description.length < 10) {
      return NextResponse.json({ error: "Description is too short" }, { status: 400 });
    }

    // Get user name for notifications
    const { data: userData, error: userError } = await supabase.from("users").select("name").eq("id", userId).single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Insert bug report into database
    const { data: bugReport, error } = await supabase
      .from("bug_reports")
      .insert({
        user_id: userId,
        title: data.title,
        description: data.description,
        steps_to_reproduce: data.steps_to_reproduce || null,
        severity: data.severity,
        status: "new",
        device_info: data.device_info || null,
        browser_info: data.browser_info || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to create bug report" }, { status: 500 });
    }

    // Notify admins (optional)

    await supabase.from("notifications").insert({
      user_id: "admin", // Special admin user ID or use a specific admin ID
      message: `New bug report: "${data.title}" submitted by ${userData.name}`,
      type: "bug_report",
      is_read: false,
    });

    return NextResponse.json({ success: true, bugReport });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
