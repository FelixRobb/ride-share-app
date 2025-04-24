import crypto from "crypto";

import { NextResponse } from "next/server";

import { supabase } from "@/lib/db";

export async function POST(request: Request) {
  try {
    // Get the user ID from the request
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Check if the user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours for admin-generated links

    // Delete any existing tokens for this user
    await supabase.from("password_reset_tokens").delete().eq("user_id", userId);

    // Insert the new token
    const { error: insertError } = await supabase.from("password_reset_tokens").insert({
      user_id: userId,
      token: resetToken,
      expires_at: expiresAt.toISOString(),
      created_by_admin: true,
    });

    if (insertError) {
      return NextResponse.json({ error: "Failed to generate reset token" }, { status: 500 });
    }

    // Generate the reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    return NextResponse.json({ resetUrl });
  } catch (error) {
    console.error("Error generating reset link:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
