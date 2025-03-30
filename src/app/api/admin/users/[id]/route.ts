import { NextResponse } from "next/server";

import { supabase } from "@/lib/db";

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const { name, email, phone, isVerified } = await request.json();

  try {
    const { data, error } = await supabase
      .from("users")
      .update({ name, email, phone, is_verified: isVerified })
      .eq("id", id)
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json(data[0]);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  try {
    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
