import { parsePhoneNumber } from "libphonenumber-js";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { sendImmediateNotification } from "@/lib/pushNotificationService";

export async function POST(request: Request) {
  const { contactPhone } = await request.json();
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const userId = session.user.id;
  try {
    // Parse and validate the phone number
    const phoneNumber = parsePhoneNumber(contactPhone);
    if (!phoneNumber || !phoneNumber.isValid()) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const e164PhoneNumber = phoneNumber.format("E.164");

    const { data: contactUser, error: contactUserError } = await supabase
      .from("users")
      .select("id, name, phone")
      .eq("phone", e164PhoneNumber)
      .single();

    if (contactUserError || !contactUser) {
      return NextResponse.json({ error: "Contact user not found" }, { status: 404 });
    }

    const { data: existingContact } = await supabase
      .from("contacts")
      .select("*")
      .or(
        `and(user_id.eq.${userId},contact_id.eq.${contactUser.id}),and(user_id.eq.${contactUser.id},contact_id.eq.${userId})`
      )
      .single();

    if (existingContact) {
      return NextResponse.json({ error: "Contact already exists" }, { status: 409 });
    }

    const { data: newContact, error: insertError } = await supabase
      .from("contacts")
      .insert({
        user_id: userId,
        contact_id: contactUser.id,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    await sendImmediateNotification(
      contactUser.id,
      "New Contact Request",
      "You have a new contact request"
    );

    const { error: notificationError } = await supabase.from("notifications").insert({
      user_id: contactUser.id,
      message: "You have a new contact request",
      type: "contactRequest",
      related_id: newContact.id,
    });

    if (notificationError) throw notificationError;

    return NextResponse.json({
      contact: {
        ...newContact,
        contact_name: contactUser.name,
        contact_phone: contactUser.phone,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
