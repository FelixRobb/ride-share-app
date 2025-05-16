import { supabase } from "@/lib/db";

/**
 * Fetches all contacts for a given user
 *
 * @param userId - The ID of the user whose contacts to fetch
 * @returns An object containing the contacts data and any error
 */
export async function getUserContacts(userId: string) {
  return await supabase
    .from("contacts")
    .select(
      `
      *,
      user:users!contacts_user_id_fkey (id, name, phone),
      contact:users!contacts_contact_id_fkey (id, name, phone)
    `
    )
    .or(`user_id.eq.${userId},contact_id.eq.${userId}`);
}
