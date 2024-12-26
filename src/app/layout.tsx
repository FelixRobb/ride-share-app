"use client"

import "./globals.css";
import { useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "next-themes"
import { checkUser } from "@/utils/api"
import { useToast } from "@/hooks/use-toast"


export const metadata = {
  title: 'Ride Sharing App for Parents',
  description: 'A simple and intuitive ride-sharing app for parents to coordinate and share rides for their children.',
  openGraph: {
    title: 'Ride Sharing App for Parents',
    description: 'Simplified ride-sharing for parents to manage lifts, notifications, and connections.',
    url: 'https://rideshareappweb.netlify.app',
    siteName: 'Ride Sharing App for Parents',
    images: [
      {
        url: 'https://rideshareappweb.netlify.app/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Illustration of ride-sharing for parents.',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ride Sharing App for Parents',
    description: 'Coordinate and share rides for children with ease using our app.',
    images: ['https://rideshareappweb.netlify.app/twitter-image.jpg'],
  },
  metadataBase: new URL('https://rideshareappweb.netlify.app'),
};


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
      </body>
    </html>
  )
}

