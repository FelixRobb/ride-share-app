import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/db";
import type { ReportFormData } from "@/types";

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reporterId = session.user.id;
    const data: ReportFormData = await request.json();

    // Validate required fields
    if (!data.reason || !data.details || !data.reported_id || !data.report_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate details length
    if (data.details.length < 10) {
      return NextResponse.json(
        { error: "Please provide more details about the issue" },
        { status: 400 }
      );
    }

    // Check if user is reporting themselves
    if (reporterId === data.reported_id) {
      return NextResponse.json({ error: "You cannot report yourself" }, { status: 400 });
    }

    // Check if ride exists if reporting a ride
    if (data.report_type === "ride" && data.ride_id) {
      const { data: rideData, error: rideError } = await supabase
        .from("rides")
        .select("id")
        .eq("id", data.ride_id)
        .single();

      if (rideError || !rideData) {
        return NextResponse.json({ error: "Ride not found" }, { status: 404 });
      }
    }

    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, name")
      .eq("id", data.reported_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "Reported user not found" }, { status: 404 });
    }

    // Get reporter name
    const { data: reporterData, error: reporterError } = await supabase
      .from("users")
      .select("name")
      .eq("id", reporterId)
      .single();

    if (reporterError || !reporterData) {
      return NextResponse.json({ error: "Reporter not found" }, { status: 404 });
    }

    // Insert report into database
    const { data: report, error } = await supabase
      .from("reports")
      .insert({
        reporter_id: reporterId,
        reported_id: data.reported_id,
        reason: data.reason,
        details: data.details,
        status: "pending",
        report_type: data.report_type,
        ride_id: data.ride_id || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
    }

    return NextResponse.json({ success: true, report });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
