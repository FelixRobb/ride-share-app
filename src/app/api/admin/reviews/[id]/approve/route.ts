import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const { error } = await supabase.from("reviews").update({ is_approved: true }).eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to approve review" }, { status: 500 });
  }
}
