import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import bcrypt from "bcrypt";
import { sendEmail, getWelcomeEmailContent } from "@/lib/emailService";
import { parsePhoneNumber } from "libphonenumber-js";
import { SignJWT } from "jose";

export async function POST(request: Request) {
  const { name, phone, email, password } = await request.json();

  try {
    // Parse and validate the phone number
    const phoneNumber = parsePhoneNumber(phone);
    if (!phoneNumber || !phoneNumber.isValid()) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const e164PhoneNumber = phoneNumber.format("E.164");

    // Check if email already exists
    const { data: existingEmail } = await supabase.from("users").select("email").eq("email", email.toLowerCase()).single();

    if (existingEmail) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Check if phone already exists
    const { data: existingPhone } = await supabase.from("users").select("phone").eq("phone", e164PhoneNumber).single();

    if (existingPhone) {
      return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const lowerCaseEmail = email.toLowerCase();

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        name,
        phone: e164PhoneNumber,
        email: lowerCaseEmail,
        password: hashedPassword,
      })
      .select("id, name, phone, email")
      .single();

    if (insertError) throw insertError;

    // Create JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ userId: newUser.id }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1d").sign(secret);

    // Send welcome email

    const welcomeEmailContent = getWelcomeEmailContent(newUser.name);
    await sendEmail(newUser.email, "Welcome to RideShare!", welcomeEmailContent);

    const response = NextResponse.json({ user: newUser });
    response.cookies.set("jwt", token, {
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
