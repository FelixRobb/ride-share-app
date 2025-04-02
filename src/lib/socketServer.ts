import type { Server as NetServer } from "http";

import { Server as SocketIOServer } from "socket.io";

import type { Contact, Ride } from "@/types";

import { getSupabaseClient } from "./db";

let io: SocketIOServer | null = null;

export type SocketData = {
  userId: string;
};

export function getSocketServer(server?: NetServer): SocketIOServer {
  if (!io && server) {
    io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      // Authenticate user and join their personal room
      socket.on("authenticate", (userId: string) => {
        if (!userId) return;

        // Store user ID in socket data
        socket.data.userId = userId;

        // Join user-specific room
        socket.join(`user:${userId}`);
        console.log(`User ${userId} authenticated and joined room`);

        // Send initial data
        emitDashboardUpdate(userId);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    // Set up Supabase realtime subscription for rides table
    const supabase = getSupabaseClient();

    supabase
      .channel("rides-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rides",
        },
        (payload) => {
          // When a ride changes, find affected users and emit updates
          const rideData = payload.new as Ride;
          if (rideData) {
            // Notify requester
            if (rideData.requester_id) {
              emitDashboardUpdate(rideData.requester_id);
            }

            // Notify accepter if exists
            if (rideData.accepter_id) {
              emitDashboardUpdate(rideData.accepter_id);
            }

            // For new or updated rides, we should also notify contacts
            // This would require additional logic to find all contacts of the requester
            notifyContacts(rideData.requester_id);
          }
        }
      )
      .subscribe();

    // Set up subscription for contacts table
    supabase
      .channel("contacts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contacts",
        },
        (payload) => {
          const contactData = payload.new as Contact;
          if (contactData) {
            // Notify both users involved in the contact
            emitDashboardUpdate(contactData.user_id as string);
            emitDashboardUpdate(contactData.contact_id as string);
          }
        }
      )
      .subscribe();
  }

  if (!io) {
    throw new Error("Socket.IO server not initialized");
  }

  return io;
}

// Function to emit dashboard update to a specific user
export async function emitDashboardUpdate(userId: string) {
  if (!io) return;

  try {
    const supabase = getSupabaseClient();

    // Fetch contacts data
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

    // Extract connected user IDs (only for accepted contacts)
    const connectedUserIds = contacts
      .filter((contact) => contact.status === "accepted")
      .map((contact) => (contact.user_id === userId ? contact.contact_id : contact.user_id));

    // Fetch rides data
    const { data: rides, error: ridesError } = await supabase
      .from("rides")
      .select(
        `
        *,
        requester:users!rides_requester_id_fkey (id, name, phone),
        accepter:users!rides_accepter_id_fkey (id, name, phone)
      `
      )
      .or(
        `requester_id.eq.${userId},accepter_id.eq.${userId},requester_id.in.(${connectedUserIds.join(",") || 0})`
      )
      .or("status.eq.pending,status.eq.accepted,status.in.(completed,cancelled)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (ridesError) throw ridesError;

    // Emit the dashboard data to the user's room
    io.to(`user:${userId}`).emit("dashboard:update", { rides, contacts });
  } catch (error) {
    console.error("Error emitting dashboard update:", error);
  }
}

// Function to notify all contacts of a user about changes
async function notifyContacts(userId: string) {
  if (!userId) return;

  try {
    const supabase = getSupabaseClient();

    // Get all accepted contacts of the user
    const { data: contacts, error } = await supabase
      .from("contacts")
      .select("contact_id, user_id")
      .or(`user_id.eq.${userId},contact_id.eq.${userId}`)
      .eq("status", "accepted");

    if (error) throw error;

    // Emit updates to all contacts
    for (const contact of contacts) {
      const contactUserId = contact.user_id === userId ? contact.contact_id : contact.user_id;
      emitDashboardUpdate(contactUserId);
    }
  } catch (error) {
    console.error("Error notifying contacts:", error);
  }
}
