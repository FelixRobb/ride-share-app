import { UAParser } from "ua-parser-js";
import { v4 as uuidv4 } from "uuid";

// Generate a unique device ID or retrieve existing one
export function getDeviceId(): string {
  // Check if we're in a browser environment
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    // For SSR, return a temporary ID
    return "server-side";
  }

  const storageKey = "rideshare_device_id";
  let deviceId = localStorage.getItem(storageKey);

  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem(storageKey, deviceId);
  }

  return deviceId;
}

// Get device information for display
export function getDeviceInfo(): { name: string; type: string } {
  // Check if we're in a browser environment
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    // Return default values for SSR
    return { name: "Unknown Browser", type: "Unknown" };
  }

  const parser = new UAParser();
  const result = parser.getResult();

  const browser = result.browser.name || "Unknown Browser";
  const os = result.os.name || "Unknown OS";
  const device = result.device.type
    ? result.device.type.charAt(0).toUpperCase() + result.device.type.slice(1)
    : "Desktop";

  return {
    name: `${browser} on ${os}`,
    type: device,
  };
}

// Format date for last used display
export function formatLastUsed(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)} weeks ago`;
  } else {
    return date.toLocaleDateString();
  }
}
