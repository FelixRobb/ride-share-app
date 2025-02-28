import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        *,
        users:user_id (name)
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    const reviews = data.map((review) => ({
      id: review.id,
      userName: review.users.name || "Unknown User",
      review: review.review,
      rating: review.rating,
      created_at: review.created_at,
    }));

    return NextResponse.json(reviews);
  } catch {
    return NextResponse.json({ error: "Failed to fetch approved reviews" }, { status: 500 });
  }
}
