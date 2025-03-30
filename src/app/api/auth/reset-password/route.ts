import crypto from "crypto";

import { hash } from "bcrypt";
import { NextResponse } from "next/server";

import { supabase } from "@/lib/db";
import { sendEmail, getResetPasswordEmailContent } from "@/lib/emailService";

export async function POST(request: Request) {
  const { email } = await request.json();

  const lowerCaseEmail = email.toLowerCase();

  try {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", lowerCaseEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    const { error: insertError } = await supabase.from("password_reset_tokens").insert({
      user_id: user.id,
      token,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) throw insertError;

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    const resetEmailContent = getResetPasswordEmailContent(resetUrl);
    await sendEmail(email, "Reset your password", resetEmailContent);

    return NextResponse.json({ message: "Password reset email sent" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { token, newPassword } = await request.json();

  try {
    const { data: resetToken, error: tokenError } = await supabase
      .from("password_reset_tokens")
      .select("user_id")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (tokenError || !resetToken) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    const hashedPassword = await hash(newPassword, 10);

    const { error: updateError } = await supabase
      .from("users")
      .update({ password: hashedPassword })
      .eq("id", resetToken.user_id);

    if (updateError) throw updateError;

    const { error: deleteError } = await supabase
      .from("password_reset_tokens")
      .delete()
      .eq("user_id", resetToken.user_id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ message: "Password reset successful" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
