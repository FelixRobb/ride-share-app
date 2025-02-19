import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params; // Extract ID from route parameters

    if (!id) {
      return NextResponse.json({ error: "Missing review ID" }, { status: 400 });
    }

    const { error } = await supabase.from("reviews").update({ is_approved: true }).eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to approve review" }, { status: 500 });
  }
}