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

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      router.push("/dashboard")
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case "INVALID_CREDENTIALS":
            toast.error("Invalid email/phone or password. Please try again.")
            break
          case "INVALID_PHONE_NUMBER":
            toast.error("Invalid phone number. Please check and try again.")
            break
          case "USER_NOT_FOUND":
            toast.error("User not found. Please check your credentials or register.")
            break
          case "EMAIL_NOT_VERIFIED":
            toast.error("Please verify your email before logging in.", {
              action: {
                label: "Resend verification email",
                onClick: () => handleResendVerification(identifier, loginMethod),
              },
            })
            break
          case "INVALID_PASSWORD":
            toast.error("Invalid password. Please try again.")
            break
          default:
            toast.error("An unexpected error occurred. Please try again.")
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async (identifier: string, loginMethod: "email" | "phone") => {
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, loginMethod }),
      })
      if (response.ok) {
        toast.success("Verification email sent. Please check your inbox.")
      } else {
        const data = await response.json()
        throw new Error(data.error || "Failed to resend verification email")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
    }
  }

  return <LoginPage handleLoginAction={handleLogin} isLoading={isLoading} quoteIndex={quoteIndex} />
}

