import { NextResponse } from "next/server";

import { supabase } from "@/lib/db";

export async function POST(request: Request) {
  const { userId, reviewerName, review, rating } = await request.json();

  if (!userId || !reviewerName || !review || !rating) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("reviews")
      .insert({ user_id: userId, reviewer_name: reviewerName, review, rating })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, review: data });
  } catch {
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
