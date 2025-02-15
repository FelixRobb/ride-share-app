import { NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import bcrypt from "bcrypt"
import { sendEmail, getWelcomeEmailContent } from "@/lib/emailService"
import { parsePhoneNumber } from "libphonenumber-js"
import { signIn } from "next-auth/react"

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
      })
      .select("id, name, phone, email")
      .single()

    if (insertError) throw insertError

    // Send welcome email
    const welcomeEmailContent = getWelcomeEmailContent(newUser.name)
    await sendEmail(newUser.email, "Welcome to RideShare!", welcomeEmailContent)

    // Sign in the user
    const result = await signIn("credentials", {
      identifier: lowerCaseEmail,
      password,
      redirect: false,
    })

    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    return NextResponse.json({ user: newUser })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

