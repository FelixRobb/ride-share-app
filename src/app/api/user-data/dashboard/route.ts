import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = session.user.id;

    const { data: rides, error: ridesError } = await supabase.from("rides").select("*").or(`requester_id.eq.${userId},accepter_id.eq.${userId},status.eq.pending`).order("time", { ascending: false });

    if (ridesError) throw ridesError;

    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select(
        `
        *,
        user:users!contacts_user_id_fkey (id, name, phone),
        contact:users!contacts_contact_id_fkey (id, name, phone)
      `
      )
      .or(`user_id.eq.${userId},contact_id.eq.${userId}`);

    if (contactsError) throw contactsError;

    return new NextResponse(JSON.stringify({ rides, contacts }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
