import { NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  // Await params before using
  const { id } = await params

  const session = await getServerSession(authOptions)
  if (!session || !session.user || !session.user.id || session.user.id !== id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { enabled, deviceId } = await request.json()

  if (!deviceId) {
    return NextResponse.json({ error: "Device ID is required" }, { status: 400 })
  }

  try {
    const { error } = await supabase
      .from("push_subscriptions")
      .update({ enabled })
      .eq("user_id", id)
      .eq("device_id", deviceId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating push preference:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

