import { NextResponse } from "next/server";

import { supabase } from "@/lib/db";
import { sendImmediateNotification } from "@/lib/pushNotificationService";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const contactId = url.pathname.split("/").at(-2);

  try {
    // Get the contact details
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select(
        "*, user:users!contacts_user_id_fkey(name), contact:users!contacts_contact_id_fkey(name)"
      )
      .eq("id", contactId)
      .single();

    if (contactError) throw contactError;

    // Update the contact status
    const { data: updatedContact, error: updateError } = await supabase
      .from("contacts")
      .update({ status: "accepted" })
      .eq("id", contactId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Send notification to the requester
    await sendImmediateNotification(
      contact.user_id,
      "Contact Request Accepted",
      `${contact.contact.name} has accepted your contact request`
    );

    // Create a notification in the database
    const { error: notificationError } = await supabase.from("notifications").insert({
      user_id: contact.user_id,
      message: `${contact.contact.name} has accepted your contact request`,
      type: "contactAccepted",
      related_id: contactId,
    });

    if (notificationError) throw notificationError;

    return NextResponse.json({ contact: updatedContact });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
