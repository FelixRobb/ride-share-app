import { compare } from "bcrypt";
import { parsePhoneNumber } from "libphonenumber-js";
import { NextResponse } from "next/server";

import { supabase } from "@/lib/db";

export async function POST(request: Request) {
  const { identifier, password, loginMethod } = await request.json();

  if (!identifier || !password) {
    return NextResponse.json(
      { error: "Invalid credentials", code: "INVALID_CREDENTIALS" },
      { status: 400 }
    );
  }

  try {
    let query;
    const lowerCaseIdentifier = identifier.toLowerCase();

    if (loginMethod === "email") {
      query = supabase.from("users").select("*").eq("email", lowerCaseIdentifier).single();
    } else if (loginMethod === "phone") {
      const phoneNumber = parsePhoneNumber(identifier, { defaultCountry: "PT" });
      if (!phoneNumber || !phoneNumber.isValid()) {
        return NextResponse.json(
          { error: "Invalid phone number", code: "INVALID_PHONE" },
          { status: 400 }
        );
      }
      const e164PhoneNumber = phoneNumber.format("E.164");
      query = supabase.from("users").select("*").eq("phone", e164PhoneNumber).single();
    } else {
      return NextResponse.json(
        { error: "Invalid login method", code: "INVALID_LOGIN_METHOD" },
        { status: 400 }
      );
    }

    const { data: user, error } = await query;

    if (error || !user) {
      return NextResponse.json(
        { error: "User not found", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid password", code: "INVALID_PASSWORD" },
        { status: 401 }
      );
    }

    if (!user.is_verified) {
      return NextResponse.json(
        { error: "Email not verified", code: "EMAIL_NOT_VERIFIED", userId: user.id },
        { status: 403 }
      );
    }

    const { ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch {
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
