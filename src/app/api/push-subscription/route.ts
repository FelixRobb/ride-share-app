import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function POST(request: Request) {
  const { subscription, userId } = await request.json();

  try {
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert({ user_id: userId, subscription: JSON.stringify(subscription) })
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save push subscription" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { userId } = await request.json();

  try {
    const { error } = await supabase.from("push_subscriptions").delete().eq("user_id", userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete push subscription" }, { status: 500 });
  }
}
