"use client"

import type React from "react"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"

import { TutorialProvider } from "@/contexts/TutorialContext"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TutorialProvider>
          {children}
        </TutorialProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}

