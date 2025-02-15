"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader } from "lucide-react"
import { signOut, useSession } from "next-auth/react"

import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cleanupPushSubscription, unregisterServiceWorker } from "@/utils/cleanupService"

type LogoutState = {
  isLoading: boolean
  error: string | null
}

export default function LogoutPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [state, setState] = useState<LogoutState>({
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    let isMounted = true

    const handleLogout = async () => {
      try {
        const userData = session?.user
        if (!userData || !userData.id) throw new Error("User not found or ID is missing")

        await Promise.all([
          cleanupPushSubscription(userData.id),
          unregisterServiceWorker()
        ])

        await signOut({ redirect: false })

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
  }, [router, session])

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