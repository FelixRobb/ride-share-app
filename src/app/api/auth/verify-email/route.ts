import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { SignJWT } from "jose";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  try {
    // Find the token in the database
    const { data: tokenData, error: tokenError } = await supabase.from("email_verification_tokens").select("user_id, expires_at").eq("token", token).single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    // Check if the token has expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: "Token has expired" }, { status: 400 });
    }

    // Update user's verified status
    const { error: updateError } = await supabase.from("users").update({ is_verified: true }).eq("id", tokenData.user_id);

    if (updateError) {
      throw updateError;
    }

    // Delete the used token
    await supabase.from("email_verification_tokens").delete().eq("token", token);

    // Create JWT for automatic login
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const jwt = await new SignJWT({ userId: tokenData.user_id }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1d").sign(secret);

    const response = NextResponse.json({ message: "Email verified successfully" });
    response.cookies.set("jwt", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
