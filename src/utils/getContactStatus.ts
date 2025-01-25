import type { User, Contact } from "@/types"

export const getContactStatus = (user: User | Contact, currentUserId: string): string | null => {
  if ("status" in user) {
    // This is a Contact object
    if (user.status === "accepted") return "Accepted"
    if (user.status === "pending") {
      return user.user_id === currentUserId ? "Pending" : "Pending their approval"
    }
    return user.status
  } else {
    // This is a User object from search results
    return user.contactStatus || null
  }
}

