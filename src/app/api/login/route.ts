import { NextResponse } from "next/server"
import { signIn } from "next-auth/react"

export async function POST(request: Request) {
  const { identifier, password } = await request.json()

  if (!identifier || !password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  try {
    const result = await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    })

    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

