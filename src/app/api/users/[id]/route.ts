import { NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { sendImmediateNotification } from "@/lib/pushNotificationService"
import { parsePhoneNumber } from "libphonenumber-js"

// PUT Handler: Update User Information
export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const userId = params.id

  const { name, phone, email } = await request.json()

  if (!userId || !name || !phone || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    // Parse the phone number
    const phoneNumber = parsePhoneNumber(phone)
    if (!phoneNumber || !phoneNumber.isValid()) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 })
    }

    const e164Number = phoneNumber.format("E.164")

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({
        name,
        phone: e164Number,
        email,
      })
      .eq("id", userId)
      .select("id, name, phone, email")
      .single()

    if (error) throw error

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(updatedUser, { status: 200 })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE Handler: Delete User Account
export async function DELETE(request: Request) {
  const url = new URL(request.url)
  const userId = url.pathname.split("/").at(-1)

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 })
  }

  try {
    // Get user's contacts
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("*")
      .or(`user_id.eq.${userId},contact_id.eq.${userId}`)

    if (contactsError) throw contactsError

    // Delete user's contacts
    const { error: deleteContactsError } = await supabase
      .from("contacts")
      .delete()
      .or(`user_id.eq.${userId},contact_id.eq.${userId}`)

    if (deleteContactsError) throw deleteContactsError

    // Update rides where user is requester or accepter
    const { error: updateRidesError } = await supabase
      .from("rides")
      .update({ status: "cancelled" })
      .or(`requester_id.eq.${userId},accepter_id.eq.${userId}`)

    if (updateRidesError) throw updateRidesError

    // Get affected rides
    const { data: affectedRides, error: affectedRidesError } = await supabase
      .from("rides")
      .select("*")
      .or(`requester_id.eq.${userId},accepter_id.eq.${userId}`)

    if (affectedRidesError) throw affectedRidesError

    // Delete user's notifications
    const { error: deleteNotificationsError } = await supabase.from("notifications").delete().eq("user_id", userId)

    if (deleteNotificationsError) throw deleteNotificationsError

    // Notify contacts about account deletion
    const contactNotifications = contacts.map((contact) => ({
      user_id: contact.user_id.toString() === userId ? contact.contact_id : contact.user_id,
      message: "A contact has deleted their account",
      type: "contactDeleted",
      related_id: userId,
    }))

    // Notify users affected by ride cancellations
    const rideNotifications = affectedRides
      .map((ride) => ({
        user_id: ride.requester_id.toString() === userId ? ride.accepter_id : ride.requester_id,
        message: "A ride has been cancelled due to user account deletion",
        type: "rideCancelled",
        related_id: ride.id,
      }))
      .filter((notification) => notification.user_id)

    for (const notification of [...contactNotifications, ...rideNotifications]) {
      await sendImmediateNotification(notification.user_id, "Account Deletion Notification", notification.message)
      await supabase.from("notifications").insert(notification)
    }

    // Finally, delete the user
    const { error: deleteUserError } = await supabase.from("users").delete().eq("id", userId)

    if (deleteUserError) throw deleteUserError

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

