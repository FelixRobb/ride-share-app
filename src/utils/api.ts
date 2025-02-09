import type { User, RideData, Contact, AssociatedPerson, Notification, Ride, Note } from "../types"

export const login = async (email: string, password: string): Promise<User> => {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  const data = await response.json()
  if (response.ok && data.user) {
    return data.user
  } else {
    throw new Error(data.error || "Invalid credentials. Please try again.")
  }
}

export const register = async (name: string, phone: string, email: string, password: string): Promise<User> => {
  const response = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, phone, email, password }),
  })
  const data = await response.json()
  if (response.ok && data.user) {
    return data.user
  } else {
    throw new Error(data.error || "Failed to register. Please try again.")
  }
}

export const createRide = async (rideData: RideData, userId: string) => {
  const response = await fetch("/api/rides", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...rideData, requester_id: userId }),
  })
  if (response.ok) {
    return await response.json()
  } else {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to create ride. Please try again.")
  }
}

export const acceptRide = async (rideId: string, userId: string) => {
  const response = await fetch(`/api/rides/${rideId}/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  })
  if (response.ok) {
    return await response.json()
  } else {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to accept ride. Please try again.")
  }
}

export const cancelRequest = async (rideId: string, userId: string) => {
  const response = await fetch(`/api/rides/${rideId}/cancelrequest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  })
  if (response.ok) {
    return await response.json()
  } else {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to cancel request. Please try again.")
  }
}

export const cancelOffer = async (rideId: string, userId: string) => {
  const response = await fetch(`/api/rides/${rideId}/canceloffer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  })
  if (response.ok) {
    return await response.json()
  } else {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to cancel offer. Please try again.")
  }
}

export const updateRide = async (rideId: string, rideData: RideData, userId: string) => {
  const response = await fetch(`/api/rides/${rideId}/edit`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...rideData, userId }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to update ride. Please try again.")
  }

  return await response.json()
}

export const addNote = async (rideId: string, userId: string, note: string): Promise<Note> => {
  const response = await fetch(`/api/rides/${rideId}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, note }),
  })
  if (response.ok) {
    const data = await response.json()
    return data.note
  } else {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to add note. Please try again.")
  }
}

export const fetchNotes = async (rideId: string): Promise<Note[]> => {
  const response = await fetch(`/api/rides/${rideId}/notes`)
  if (response.ok) {
    const data = await response.json()
    return data.notes
  } else {
    throw new Error("Failed to fetch notes")
  }
}

export const editNote = async (noteId: string, userId: string, note: string): Promise<Note> => {
  const response = await fetch(`/api/rides/${noteId}/notes`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ noteId, userId, note }),
  })
  if (response.ok) {
    const data = await response.json()
    return data.note
  } else {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to edit note. Please try again.")
  }
}

export const deleteNote = async (noteId: string, userId: string): Promise<void> => {
  const response = await fetch(`/api/rides/${noteId}/notes`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ noteId, userId }),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to delete note. Please try again.")
  }
}

export const markNoteAsSeen = async (noteId: string, userId: string): Promise<void> => {
  const response = await fetch(`/api/rides/${noteId}/notes`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ noteId, userId }),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to mark note as seen. Please try again.")
  }
}

export const addContact = async (userId: string, contactPhone: string): Promise<Contact> => {
  const response = await fetch("/api/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, contactPhone }),
  })
  const data = await response.json()
  if (response.ok && data.contact) {
    return data.contact
  } else {
    throw new Error(data.error || "Failed to add contact. User not found or an error occurred.")
  }
}

export const acceptContact = async (contactId: string, userId: string): Promise<Contact> => {
  const response = await fetch(`/api/contacts/${contactId}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  })
  const data = await response.json()
  if (response.ok && data.contact) {
    return data.contact
  } else {
    throw new Error(data.error || "Failed to accept contact. Please try again.")
  }
}

export const deleteContact = async (contactId: string, userId: string) => {
  const response = await fetch(`/api/contacts/${contactId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to delete contact. Please try again.")
  }
}

export const updateProfile = async (userId: string, updatedUser: Partial<User>) => {
  const response = await fetch(`/api/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedUser),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to update profile")
  }
  return await response.json()
}

export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const response = await fetch(`/api/users/${userId}/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to change password")
  }
}

export const addAssociatedPerson = async (
  userId: string,
  name: string,
  relationship: string,
): Promise<AssociatedPerson> => {
  const response = await fetch("/api/associated-people", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, name, relationship }),
  })
  const data = await response.json()
  if (response.ok && data.associatedPerson) {
    return data.associatedPerson
  } else {
    throw new Error(data.error || "Failed to add associated person. Please try again.")
  }
}

export const deleteAssociatedPerson = async (personId: string, userId: string) => {
  const response = await fetch(`/api/associated-people?id=${personId}&userId=${userId}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to delete associated person. Please try again.")
  }
}

export const deleteUser = async (userId: string) => {
  const response = await fetch(`/api/users/${userId}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to delete account. Please try again.")
  }
}

export const markNotificationsAsRead = async (userId: string, notificationIds: string[]) => {
  const response = await fetch("/api/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, notificationIds }),
  })
  if (!response.ok) {
    throw new Error("Failed to mark notifications as read")
  }
}

export const fetchUserData = async (userId: string, etag: string | null) => {
  const headers: HeadersInit = {}
  if (etag) {
    headers["If-None-Match"] = etag
  }

  const response = await fetch(`/api/user-data?userId=${userId}`, { headers })

  if (response.status === 304) {
    // Data hasn't changed
    return null
  }

  if (response.ok) {
    const newEtag = response.headers.get("ETag")
    const data = await response.json()
    return { data, newEtag }
  } else {
    throw new Error("Failed to fetch user data")
  }
}

export const fetchNotifications = async (userId: string): Promise<Notification[]> => {
  const response = await fetch(`/api/notifications?userId=${userId}`)
  if (response.ok) {
    const data = await response.json()
    return data.notifications as Notification[]
  } else {
    throw new Error("Failed to fetch notifications")
  }
}

export const fetchRideDetails = async (userId: string, rideId: string): Promise<Ride> => {
  const response = await fetch(`/api/rides/${rideId}?userId=${userId}`)
  if (response.ok) {
    const data = await response.json()
    return data.ride
  } else {
    throw new Error("Failed to fetch ride details, or you don't have permission to see this ride. Please go back.")
  }
}


export const finishRide = async (rideId: string, userId: string) => {
  const response = await fetch(`/api/rides/${rideId}/finish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  })
  if (response.ok) {
    return await response.json()
  } else {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to finish ride. Please try again.")
  }
}

export const fetchUserStats = async (userId: string): Promise<{ ridesOffered: number; ridesRequested: number }> => {
  const response = await fetch(`/api/users/${userId}/stats`)
  if (!response.ok) {
    throw new Error("Failed to fetch user stats")
  }
  return await response.json()
}

