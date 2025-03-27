import { NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params

  const session = await getServerSession(authOptions)
  if (!session || !session.user || !session.user.id || session.user.id !== id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("device_id, device_name, enabled, last_used")
      .eq("user_id", id)
      .order("last_used", { ascending: false })

    if (error) throw error

    return NextResponse.json({ devices: data })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

