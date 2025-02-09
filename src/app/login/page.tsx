"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"

import LoginPage from "@/components/LoginPage"

export default function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const [quoteIndex, setQuoteIndex] = useState<number | null>(null)

  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * 15))
  }, [])

  if (quoteIndex === null) return null

  const handleLogin = async (identifier: string, password: string, loginMethod: "email" | "phone") => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password, loginMethod }),
      })

      if (!response.ok) {
        throw new Error("Login failed")
      }

      router.push("/dashboard")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <LoginPage
      handleLoginAction={handleLogin}
      isLoading={isLoading}
      quoteIndex={quoteIndex} // Pass the index as a prop
    />
  )
}

