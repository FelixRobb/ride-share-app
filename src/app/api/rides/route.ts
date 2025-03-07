import { NextResponse, type NextRequest } from "next/server";
import { supabase } from "@/lib/db";
import { sendImmediateNotification } from "@/lib/pushNotificationService";
import { parsePhoneNumber } from "libphonenumber-js";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = session.user.id;

    const requester_id = userId;

    const { from_location, to_location, from_lat, from_lon, to_lat, to_lon, time, rider_name, rider_phone, note } = await request.json();

    try {
      let formattedRiderPhone = rider_phone;
      if (rider_phone) {
        const phoneNumber = parsePhoneNumber(rider_phone);
        if (phoneNumber && phoneNumber.isValid()) {
          formattedRiderPhone = phoneNumber.format("E.164");
        } else {
          // Handle invalid phone number, e.g., set to null or throw an error
          formattedRiderPhone = null;
        }
      }

      const { data: newRide, error: insertError } = await supabase
        .from("rides")
        .insert({
          from_location,
          to_location,
          from_lat,
          from_lon,
          to_lat,
          to_lon,
          time,
          requester_id,
          status: "pending",
          rider_name,
          rider_phone: formattedRiderPhone,
          note,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Notify contacts about the new ride
      const { data: contacts, error: contactsError } = await supabase.from("contacts").select("contact_id").eq("user_id", requester_id).eq("status", "accepted");

      if (contactsError) throw contactsError;

      // Fetch the current user's name
      const { data: currentUser, error: userError } = await supabase.from("users").select("name").eq("id", requester_id).single();

      if (userError) throw userError;

      for (const contact of contacts) {
        await sendImmediateNotification(contact.contact_id, "New Ride Available", `A new ride is available from your contact ${currentUser.name} from ${from_location} to ${to_location}`);
        await supabase.from("notifications").insert({
          user_id: contact.contact_id,
          message: `A new ride is available from your contact ${currentUser.name} from ${from_location} to ${to_location}`,
          type: "newRide",
          related_id: newRide.id,
        });
      }

      return NextResponse.json({ ride: newRide });
    } catch {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
