import type { User, RideData, Contact, AssociatedPerson, Note, BugReportFormData } from "../types";

export const createRide = async (rideData: RideData, userId: string) => {
  const response = await fetch("/api/rides", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...rideData, requester_id: userId }),
  });
  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create ride. Please try again.");
  }
};

export const acceptRide = async (rideId: string, userId: string) => {
  const response = await fetch(`/api/rides/${rideId}/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });
  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to accept ride. Please try again.");
  }
};

export const cancelRequest = async (rideId: string, userId: string) => {
  const response = await fetch(`/api/rides/${rideId}/cancelrequest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });
  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to cancel request. Please try again.");
  }
};

export const cancelOffer = async (rideId: string, userId: string) => {
  const response = await fetch(`/api/rides/${rideId}/canceloffer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });
  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to cancel offer. Please try again.");
  }
};

export const updateRide = async (rideId: string, rideData: RideData, userId: string) => {
  const response = await fetch(`/api/rides/${rideId}/edit`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...rideData, userId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update ride. Please try again.");
  }

  return await response.json();
};

export const addNote = async (rideId: string, userId: string, note: string): Promise<Note> => {
  const response = await fetch(`/api/rides/${rideId}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, note }),
  });
  if (response.ok) {
    const data = await response.json();
    return data.note;
  } else {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to add note. Please try again.");
  }
};

export const fetchNotes = async (rideId: string): Promise<Note[]> => {
  const response = await fetch(`/api/rides/${rideId}/notes`);
  if (response.ok) {
    const data = await response.json();
    return data.notes;
  } else {
    throw new Error("Failed to fetch notes");
  }
};

export const editNote = async (noteId: string, userId: string, note: string): Promise<Note> => {
  const response = await fetch(`/api/rides/${noteId}/notes`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ noteId, userId, note }),
  });
  if (response.ok) {
    const data = await response.json();
    return data.note;
  } else {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to edit note. Please try again.");
  }
};

export const deleteNote = async (noteId: string, userId: string): Promise<void> => {
  const response = await fetch(`/api/rides/${noteId}/notes`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ noteId, userId }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete note. Please try again.");
  }
};

export const markNoteAsSeen = async (noteId: string, userId: string): Promise<void> => {
  const response = await fetch(`/api/rides/${noteId}/notes`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ noteId, userId }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to mark note as seen. Please try again.");
  }
};

export const addContact = async (userId: string, contactPhone: string): Promise<Contact> => {
  const response = await fetch("/api/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, contactPhone }),
  });
  const data = await response.json();
  if (response.ok && data.contact) {
    return data.contact;
  } else {
    throw new Error(data.error || "Failed to add contact. User not found or an error occurred.");
  }
};

export const acceptContact = async (contactId: string, userId: string): Promise<Contact> => {
  const response = await fetch(`/api/contacts/${contactId}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  const data = await response.json();
  if (response.ok && data.contact) {
    return data.contact;
  } else {
    throw new Error(data.error || "Failed to accept contact. Please try again.");
  }
};

export const deleteContact = async (contactId: string, userId: string) => {
  const response = await fetch(`/api/contacts/${contactId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete contact. Please try again.");
  }
};

export const updateProfile = async (userId: string, updatedUser: Partial<User>) => {
  const response = await fetch(`/api/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedUser),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update profile");
  }
  return await response.json();
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const response = await fetch(`/api/users/${userId}/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to change password");
  }
};

export const addAssociatedPerson = async (userId: string, name: string, relationship: string): Promise<AssociatedPerson> => {
  const response = await fetch("/api/associated-people", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, name, relationship }),
  });
  const data = await response.json();
  if (response.ok && data.associatedPerson) {
    return data.associatedPerson;
  } else {
    throw new Error(data.error || "Failed to add associated person. Please try again.");
  }
};

export const deleteAssociatedPerson = async (personId: string, userId: string) => {
  const response = await fetch(`/api/associated-people?id=${personId}&userId=${userId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete associated person. Please try again.");
  }
};

export const deleteUser = async (userId: string) => {
  const response = await fetch(`/api/users/${userId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete account. Please try again.");
  }
};

export const markNotificationsAsRead = async (userId: string, notificationIds: string[]) => {
  const response = await fetch("/api/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, notificationIds }),
  });
  if (!response.ok) {
    throw new Error("Failed to mark notifications as read");
  }
};

export const finishRide = async (rideId: string, userId: string) => {
  const response = await fetch(`/api/rides/${rideId}/finish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });
  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to finish ride. Please try again.");
  }
};

export const fetchUserStats = async (userId: string): Promise<{ ridesOffered: number; ridesRequested: number }> => {
  const response = await fetch(`/api/users/${userId}/stats`);
  if (!response.ok) {
    throw new Error("Failed to fetch user stats");
  }
  return await response.json();
};

export const fetchDashboardData = async () => {
  const response = await fetch(`/api/user-data/dashboard`);
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error("Failed to fetch dashboard data");
  }
};

export const fetchProfileData = async () => {
  const response = await fetch(`/api/user-data/profile`);
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error("Failed to fetch profile data");
  }
};

export const fetchRideDetailsData = async (rideId: string) => {
  try {
    const response = await fetch(`/api/user-data/ride-details?rideId=${rideId}`);

    const data = await response.json();

    if (response.status === 403) {
      throw { permissionDenied: true, message: data.error };
    }

    if (!response.ok) {
      console.error("Error response from ride-details API:", data);
      throw new Error(data.error || "Failed to fetch ride details");
    }

    return data;
  } catch (error) {
    console.error("Error fetching ride details:", error);
    throw error;
  }
};

export const fetchEditRideData = async (rideId: string) => {
  const response = await fetch(`/api/user-data/edit-ride?rideId=${rideId}`);
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error("Failed to fetch edit ride data");
  }
};

export const fetchCreateRideData = async () => {
  const response = await fetch(`/api/user-data/create-ride`);
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error("Failed to fetch create ride data");
  }
};

// Submit a report
export async function submitReport(reportData: { reason: string; details: string; report_type: "user" | "ride"; reported_id: string; ride_id?: string | null }) {
  const response = await fetch("/api/reports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reportData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to submit report");
  }

  return await response.json();
}

// Get admin reports
export async function getAdminReports(page = 1, status = "") {
  const response = await fetch(`/api/admin/reports?page=${page}&status=${status}`);

  if (!response.ok) {
    throw new Error("Failed to fetch reports");
  }

  return await response.json();
}

// Get report statistics
export async function getReportStats() {
  const response = await fetch("/api/admin/reports/stats");

  if (!response.ok) {
    throw new Error("Failed to fetch report statistics");
  }

  return await response.json();
}

// Update report status
export async function updateReportStatus(reportId: string, status: string, adminNotes: string) {
  const response = await fetch(`/api/admin/reports/${reportId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status, adminNotes }),
  });

  if (!response.ok) {
    throw new Error("Failed to update report");
  }

  return await response.json();
}

// Submit a bug report
export async function submitBugReport(bugReportData: BugReportFormData) {
  const response = await fetch("/api/bug-reports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bugReportData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to submit bug report");
  }

  return await response.json();
}

// Get admin bug reports
export async function getAdminBugReports(page = 1, status = "") {
  const response = await fetch(`/api/admin/bug-reports?page=${page}&status=${status}`);

  if (!response.ok) {
    throw new Error("Failed to fetch bug reports");
  }

  return await response.json();
}

// Get bug report statistics
export async function getBugReportStats() {
  const response = await fetch("/api/admin/bug-reports/stats");

  if (!response.ok) {
    throw new Error("Failed to fetch bug report statistics");
  }

  return await response.json();
}

// Update bug report status
export async function updateBugReportStatus(bugReportId: string, status: string, adminNotes: string) {
  const response = await fetch(`/api/admin/bug-reports/${bugReportId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status, adminNotes }),
  });

  if (!response.ok) {
    throw new Error("Failed to update bug report");
  }

  return await response.json();
}
