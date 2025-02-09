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
        const errorData = await response.json()
        throw new Error(errorData.error || "Login failed")
      }

      router.push("/dashboard")
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Invalid credentials")) {
          toast.error("Invalid email/phone or password. Please try again.")
        } else if (error.message.includes("Please verify your email")) {
          toast.error(
            "Please verify your email before logging in. Check your inbox or request a new verification email.",
          )
        } else {
          toast.error(`Login failed: ${error.message}`)
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.")
      }
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

