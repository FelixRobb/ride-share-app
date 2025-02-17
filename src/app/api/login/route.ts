import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import bcrypt from "bcrypt";
import { parsePhoneNumber } from "libphonenumber-js";

export async function POST(request: Request) {
  const { identifier, password, loginMethod } = await request.json();

  if (!identifier || !password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  try {
    let query;
    const lowerCaseIdentifier = identifier.toLowerCase();

    if (loginMethod === "email") {
      query = supabase.from("users").select("*").eq("email", lowerCaseIdentifier).single();
    } else if (loginMethod === "phone") {
      const phoneNumber = parsePhoneNumber(identifier, { defaultCountry: "PT" });
      if (!phoneNumber || !phoneNumber.isValid()) {
        return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
      }
      const e164PhoneNumber = phoneNumber.format("E.164");
      query = supabase.from("users").select("*").eq("phone", e164PhoneNumber).single();
    } else {
      return NextResponse.json({ error: "Invalid login method" }, { status: 400 });
    }

    const { data: user, error } = await query;

    if (error || !user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!user.is_verified) {
      return NextResponse.json({ error: "Email not verified", userId: user.id }, { status: 403 });
    }

    const { ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
