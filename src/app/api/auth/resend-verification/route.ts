import crypto from "crypto";

import { NextResponse } from "next/server";

import { supabase } from "@/lib/db";
import { sendEmail, getVerificationEmailContent } from "@/lib/emailService";

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { identifier, loginMethod } = body;

  if (!identifier || !loginMethod) {
    return NextResponse.json(
      { error: "Identifier and login method are required" },
      { status: 400 }
    );
  }

  try {
    // Find the user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, email, is_verified")
      .eq(loginMethod === "email" ? "email" : "phone", identifier.toLowerCase())
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.is_verified) {
      return NextResponse.json({ error: "Email is already verified" }, { status: 400 });
    }

    // Generate new verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

    // Delete any existing tokens for this user
    await supabase.from("email_verification_tokens").delete().eq("user_id", user.id);

    // Store new verification token
    const { error: tokenError } = await supabase
      .from("email_verification_tokens")
      .insert({ user_id: user.id, token, expires_at: expiresAt.toISOString() });

    if (tokenError) {
      throw tokenError;
    }

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
    const verificationEmailContent = getVerificationEmailContent(user.name, verificationUrl);
    await sendEmail(user.email, "Verify your email for RideShare", verificationEmailContent);

    return NextResponse.json({ message: "Verification email sent successfully" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
