import { NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import bcrypt from "bcrypt"
import { sendEmail, getVerificationEmailContent } from "@/lib/emailService"
import { parsePhoneNumber } from "libphonenumber-js"
import crypto from "crypto"

export async function POST(request: Request) {
  const { name, phone, email, password } = await request.json()

  try {
    // Parse and validate the phone number
    const phoneNumber = parsePhoneNumber(phone)
    if (!phoneNumber || !phoneNumber.isValid()) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 })
    }

    const e164PhoneNumber = phoneNumber.format("E.164")

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from("users")
      .select("email")
      .eq("email", email.toLowerCase())
      .single()

    if (existingEmail) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    // Check if phone already exists
    const { data: existingPhone } = await supabase.from("users").select("phone").eq("phone", e164PhoneNumber).single()

    if (existingPhone) {
      return NextResponse.json({ error: "Phone number already registered" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const lowerCaseEmail = email.toLowerCase()

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        name,
        phone: e164PhoneNumber,
        email: lowerCaseEmail,
        password: hashedPassword,
        is_verified: false,
      })
      .select("id, name, phone, email")
      .single()

    if (insertError) throw insertError

    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Token expires in 24 hours

    // Store verification token
    const { error: tokenError } = await supabase
      .from("email_verification_tokens")
      .insert({ user_id: newUser.id, token, expires_at: expiresAt.toISOString() })

    if (tokenError) throw tokenError

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`
    const verificationEmailContent = getVerificationEmailContent(newUser.name, verificationUrl)
    await sendEmail(newUser.email, "Verify your email for RideShare", verificationEmailContent)

    return NextResponse.json({ message: "Registration successful. Please check your email to verify your account." })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

