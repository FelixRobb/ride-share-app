import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { sendImmediateNotification } from "@/lib/pushNotificationService";

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rideId = url.pathname.split("/").at(-2);

  try {
    const { data: notes, error } = await supabase
      .from("ride_notes")
      .select(
        `
        *,
        user:users (name)
      `
      )
      .eq("ride_id", rideId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      notes,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Surrogate-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        },
      }
    );
  }
}

export async function POST(request: Request) {
  const { userId, note } = await request.json();
  const url = new URL(request.url);
  const rideId = url.pathname.split("/").at(-2);

  try {
    const { data: newNote, error: insertError } = await supabase
      .from("ride_notes")
      .insert({ ride_id: rideId, user_id: userId, note })
      .select(
        `
        *,
        user:users (name)
      `
      )
      .single();

    if (insertError) throw insertError;

    // Create a notification for the other user involved in the ride
    const { data: ride } = await supabase.from("rides").select("*").eq("id", rideId).single();

    if (ride) {
      const otherUserId = userId === ride.requester_id ? ride.accepter_id : ride.requester_id;
      if (otherUserId) {
        // Fetch the name of the user who added the note
        const { data: noteAuthor, error: authorError } = await supabase.from("users").select("name").eq("id", userId).single();

        if (authorError) throw authorError;

        await sendImmediateNotification(otherUserId, "New Ride Message", `${noteAuthor.name} has added a new message to your ride from ${ride.from_location} to ${ride.to_location}: "${note}"`);
        await supabase.from("notifications").insert({
          user_id: otherUserId,
          message: `${noteAuthor.name} has added a new message to your ride from ${ride.from_location} to ${ride.to_location}: "${note}"`,
          type: "newNote",
          related_id: rideId,
        });
      }
    }

    return NextResponse.json({ note: newNote });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { noteId, userId, note } = await request.json();

  try {
    const { data: updatedNote, error: updateError } = await supabase.from("ride_notes").update({ note, is_edited: true }).eq("id", noteId).eq("user_id", userId).select().single();

    if (updateError) throw updateError;

    return NextResponse.json({ note: updatedNote });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { noteId, userId } = await request.json();

  try {
    const { error: deleteError } = await supabase.from("ride_notes").update({ is_deleted: true }).eq("id", noteId).eq("user_id", userId).select().single();

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { noteId, userId } = await request.json();

  try {
    const { data: note, error: fetchError } = await supabase.from("ride_notes").select("seen_by").eq("id", noteId).single();

    if (fetchError) throw fetchError;

    const seenBy = note.seen_by || [];
    if (!seenBy.includes(userId)) {
      seenBy.push(userId);
    }

    const { data: updatedNote, error: updateError } = await supabase.from("ride_notes").update({ seen_by: seenBy }).eq("id", noteId).select().single();

    if (updateError) throw updateError;

    return NextResponse.json({ note: updatedNote });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
