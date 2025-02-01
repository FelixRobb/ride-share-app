"use client"

import type * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { useEffect } from "react"

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  useEffect(() => {
    document.body.classList.add("transition-colors", "duration-300")
  }, [])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

