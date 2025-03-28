import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export const dynamic = "force-dynamic"
export const revalidate = 0

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
      userId: review.user_id,
      review: review.review,
      rating: review.rating,
      createdAt: review.created_at,
      is_approved: review.is_approved,
      userName: review.users.name,
    }));

    return NextResponse.json(
      { reviews },
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
      { error: "Failed to fetch reviews" },
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
