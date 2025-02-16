"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { signOut } from "next-auth/react"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { unregisterServiceWorker } from "@/utils/cleanupService"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // Call the logout API
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Logout failed")
        }

        // Unregister service worker
        await unregisterServiceWorker()

        // Sign out using NextAuth
        await signOut({ redirect: false })

        toast.success("Logged out successfully")
        router.push("/")
      } catch {
        toast.error("An error occurred during logout")
      }
    }

    handleLogout()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle className="text-center">Logging Out</CardTitle>
          <CardDescription className="text-center">Please wait while we log you out...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  )
}

