"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Call logout API
        const response = await fetch("/api/logout", { method: "POST" })
        if (!response.ok) {
          throw new Error("Logout failed")
        }

        // Redirect to home page
        router.push("/")
      } catch (error) {
        console.error("Logout error:", error)
        // Even if there's an error, redirect to home page
        router.push("/")
      }
    }

    performLogout()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle className="text-center">Logging Out</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    </div>
  )
}

