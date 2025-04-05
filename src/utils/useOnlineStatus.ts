import { useState, useEffect } from "react";

export function useOnlineStatus() {
  // Default to true for SSR
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check if we are in a browser environment
    if (typeof window === "undefined") {
      return;
    }

    // Set initial state based on the browser's navigator.onLine
    setIsOnline(navigator.onLine);

    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
