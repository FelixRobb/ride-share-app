"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";

import { registerServiceWorker } from "@/utils/offlineUtils";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker when the app loads
    registerServiceWorker();
  }, []);
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
