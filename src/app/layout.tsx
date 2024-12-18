"use client"

import "./globals.css";
import { useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "next-themes"
import { checkUser } from "@/utils/api"
import { useToast } from "@/hooks/use-toast"
import { SpeedInsights } from "@vercel/speed-insights/next"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const checkCurrentUser = async () => {
      const user = localStorage.getItem("currentUser")
      if (user) {
        const parsedUser = JSON.parse(user)
        try {
          const userExists = await checkUser(parsedUser.id)
          if (!userExists) {
            localStorage.removeItem("currentUser")
            toast({
              title: "Session Expired",
              description: "Your session has expired. Please log in again.",
              variant: "destructive",
            })
            router.push('/login')
          }
        } catch (error) {
          console.error("Error checking user:", error)
          toast({
            title: "Error",
            description: "An error occurred while checking your session. Please try again.",
            variant: "destructive",
          })
        }
      }
    }

    checkCurrentUser()

    // Register service worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js');
    }
  }, [router, toast])

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
        <SpeedInsights/>
      </body>
    </html>
  )
}

