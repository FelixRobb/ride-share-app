import { NextResponse } from "next/server"
import { supabase } from "@/lib/db"

export async function POST(request: Request) {
  const { subscription, userId, deviceId, deviceName } = await request.json()

  try {
    // Check if this device already has a subscription
    const { data: existingData, error: checkError } = await supabase
      .from("push_subscriptions")
      .select("id, enabled")
      .eq("user_id", userId)
      .eq("device_id", deviceId)
      .maybeSingle()

    if (checkError) throw checkError

    // If subscription exists, update it but preserve the enabled status
    if (existingData) {
      const { error } = await supabase
        .from("push_subscriptions")
        .update({
          subscription: JSON.stringify(subscription),
          device_name: deviceName,
          last_used: new Date().toISOString(),
        })
        .eq("id", existingData.id)

      if (error) throw error

      return NextResponse.json({
        success: true,
        enabled: existingData.enabled,
      })
    }
    // Otherwise create a new subscription (enabled by default)
    else {
      const { data, error } = await supabase
        .from("push_subscriptions")
        .insert({
          user_id: userId,
          device_id: deviceId,
          subscription: JSON.stringify(subscription),
          device_name: deviceName,
          enabled: true,
          last_used: new Date().toISOString(),
        })
        .select()

      if (error) throw error

      return NextResponse.json({
        success: true,
        enabled: true,
        data,
      })
    }
  } catch (error) {
    console.error("Error saving push subscription:", error)
    return NextResponse.json({ error: "Failed to save push subscription" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { userId, deviceId } = await request.json()

  try {
    const { error } = await supabase.from("push_subscriptions").delete().match({ user_id: userId, device_id: deviceId })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting push subscription:", error)
    return NextResponse.json({ error: "Failed to delete push subscription" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const { userId, deviceId, enabled } = await request.json()

  try {
    const { error } = await supabase
      .from("push_subscriptions")
      .update({ enabled })
      .match({ user_id: userId, device_id: deviceId })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating push subscription:", error)
    return NextResponse.json({ error: "Failed to update push subscription" }, { status: 500 })
  }
}

