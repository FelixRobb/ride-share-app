"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader } from "lucide-react"
import type { User } from "@/types"

import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cleanupPushSubscription, unregisterServiceWorker } from "@/utils/cleanupService"

type LogoutState = {
  isLoading: boolean
  error: string | null
}

export default function LogoutPage() {
  const router = useRouter()
  const [state, setState] = useState<LogoutState>({
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    let isMounted = true

    const handleLogout = async () => {
      try {
        // Fetch user data first
        const userResponse = await fetch("/api/user")
        if (!userResponse.ok) {
          throw new Error("Failed to fetch user data")
        }

        const userData: User = await userResponse.json()

        // Perform logout
        const logoutResponse = await fetch("/api/logout", {
          method: "POST",
          credentials: "include"
        })

        if (!logoutResponse.ok) {
          throw new Error("Logout failed")
        }

        // Cleanup operations
        await Promise.all([
          cleanupPushSubscription(userData.id),
          unregisterServiceWorker()
        ])

      } catch (error) {
        if (isMounted) {
          setState(prev => ({ ...prev, error: String(error) }))
          toast.error("An error occurred during logout")
        }
      } finally {
        if (isMounted) {
          setState(prev => ({ ...prev, isLoading: false }))
          router.push("/")
        }
      }
    }

    handleLogout()

    return () => {
      isMounted = false
    }
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle className="text-center">
            {state.error ? "Logout Failed" : "Logging Out"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {state.isLoading && <Loader className="h-8 w-8 animate-spin" />}
          {state.error && <p className="text-sm text-destructive text-center">{state.error}</p>}
        </CardContent>
      </Card>
    </div>
  )
}