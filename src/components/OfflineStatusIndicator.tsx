"use client";

import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

import { isOnline } from "@/utils/offlineUtils";

export default function OfflineStatusIndicator() {
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    // Set up event listeners for online/offline events
    const handleOnline = () => {
      setOnline(true);
    };

    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Clean up event listeners
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online) {
    return null; // Don't show anything when online
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-md bg-yellow-100 px-3 py-2 text-sm text-yellow-800 shadow-md dark:bg-yellow-900 dark:text-yellow-200">
      <WifiOff className="h-4 w-4" />
      <span>You&apos;re offline. Some features may be limited.</span>
    </div>
  );
}
