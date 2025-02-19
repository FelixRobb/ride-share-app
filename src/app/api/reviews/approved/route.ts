import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        id,
        review,
        rating,
        users:user_id (name)
      `
      )
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(6);

    if (error) throw error;

    const reviews = data.map((review) => ({
      id: review.id,
      userName: review.users[0]?.name,
      review: review.review,
      rating: review.rating,
    }));

    return NextResponse.json(reviews);
  } catch {
    return NextResponse.json({ error: "Failed to fetch approved reviews" }, { status: 500 });
  }
}
