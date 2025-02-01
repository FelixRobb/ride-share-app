import { NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import bcrypt from "bcrypt"
import { parsePhoneNumber } from "libphonenumber-js"

export async function POST(request: Request) {
  const { identifier, password, loginMethod } = await request.json()

  if (!identifier || !password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  try {
    let query
    if (loginMethod === "email") {
      query = supabase.from("users").select("*").eq("email", identifier.toLowerCase()).single()
    } else {
      // For phone login, parse and format the number to E.164
      const phoneNumber = parsePhoneNumber(identifier)
      if (!phoneNumber || !phoneNumber.isValid()) {
        return NextResponse.json({ error: "Invalid phone number" }, { status: 400 })
      }
      const e164PhoneNumber = phoneNumber.format("E.164")

      query = supabase.from("users").select("*").eq("phone", e164PhoneNumber).single()
    }

    const { data: user, error } = await query

    if (error) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Don't send the password back to the client
    const { ...userWithoutPassword } = user
    return NextResponse.json({ user: userWithoutPassword })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

