import { NextResponse } from "next/server";

import { supabase } from "@/lib/db";
import { sendEmail, getWelcomeEmailContent } from "@/lib/emailService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  try {
    // Find the token in the database
    const { data: tokenData, error: tokenError } = await supabase
      .from("email_verification_tokens")
      .select("user_id, expires_at")
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    // Check if the token has expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: "Token has expired" }, { status: 400 });
    }

    // Update user's verified status
    const { error: updateError } = await supabase
      .from("users")
      .update({ is_verified: true })
      .eq("id", tokenData.user_id);

    if (updateError) {
      throw updateError;
    }

    // Get user's name for the welcome email
    const { data: userData } = await supabase
      .from("users")
      .select("name, email")
      .eq("id", tokenData.user_id)
      .single();

    // Send welcome email
    if (userData) {
      const welcomeEmailContent = getWelcomeEmailContent(userData.name);
      await sendEmail(userData.email, "Welcome to RideShare!", welcomeEmailContent);
    }

    // Delete the used token
    await supabase.from("email_verification_tokens").delete().eq("token", token);

    return NextResponse.json({ message: "Email verified successfully" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
