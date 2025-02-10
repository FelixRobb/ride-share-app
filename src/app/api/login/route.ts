import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import bcrypt from "bcrypt";
import { parsePhoneNumber } from "libphonenumber-js";
import { SignJWT } from "jose";

export async function POST(request: Request) {
  const { identifier, password, loginMethod } = await request.json();

  if (!identifier || !password) {
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 400 });
  }

  try {
    let query;
    if (loginMethod === "email") {
      query = supabase.from("users").select("*").eq("email", identifier.toLowerCase()).single();
    } else {
      const phoneNumber = parsePhoneNumber(identifier);
      if (!phoneNumber || !phoneNumber.isValid()) {
        return NextResponse.json({ error: "INVALID_PHONE_NUMBER" }, { status: 400 });
      }
      const e164PhoneNumber = phoneNumber.format("E.164");

      query = supabase.from("users").select("*").eq("phone", e164PhoneNumber).single();
    }

    const { data: user, error } = await query;

    if (error || !user) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    }

    if (!user.is_verified) {
      return NextResponse.json({ error: "EMAIL_NOT_VERIFIED", email: user.email }, { status: 403 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "INVALID_PASSWORD" }, { status: 401 });
    }

    // Create JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ userId: user.id }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1d").sign(secret);

    // Don't send the password back to the client
    const { ...userWithoutPassword } = user;

    const response = NextResponse.json({ user: userWithoutPassword });
    response.cookies.set("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch {
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
