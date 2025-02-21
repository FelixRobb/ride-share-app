import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { subscription } = await request.json();

    // If a subscription was provided, delete only that specific subscription
    if (subscription) {
      const { error } = await supabase.from("push_subscriptions").delete().eq("subscription", JSON.stringify(subscription));

      if (error) {
        console.error("Error deleting push subscription:", error);
      }
    }

    return NextResponse.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "An error occurred during logout" }, { status: 500 });
  }
}
