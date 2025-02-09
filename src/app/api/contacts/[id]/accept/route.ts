import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { sendImmediateNotification } from "@/lib/pushNotificationService";

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const contactId = url.pathname.split("/").at(-2);

  const { userId } = await request.json();

  try {
    const { data: contact, error: contactError } = await supabase.from("contacts").select("*").eq("id", contactId).eq("contact_id", userId).single();

    if (contactError || !contact) {
      return NextResponse.json({ error: "Contact request not found" }, { status: 404 });
    }

    const { error: updateError } = await supabase.from("contacts").update({ status: "accepted" }).eq("id", contactId);

    if (updateError) throw updateError;

    // Fetch the current user's name
    const { data: currentUser, error: userError } = await supabase.from("users").select("name").eq("id", userId).single();

    if (userError) throw userError;

    await sendImmediateNotification(contact.user_id, "Contact Request Accepted", `Your contact request has been accepted by ${currentUser.name}`);

    const { error: notificationError } = await supabase.from("notifications").insert({
      user_id: contact.user_id,
      message: `Your contact request has been accepted by ${currentUser.name}`,
      type: "contactAccepted",
      related_id: contactId,
    });

    if (notificationError) throw notificationError;

    const { data: updatedContact, error: fetchError } = await supabase
      .from("contacts")
      .select(
        `
        *,
        user:users!contacts_user_id_fkey (name, phone),
        contact:users!contacts_contact_id_fkey (name, phone)
      `
      )
      .eq("id", contactId)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json({ contact: updatedContact });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
