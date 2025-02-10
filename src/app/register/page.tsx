"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"

import RegisterPage from "@/components/RegisterPage"

interface ErrorResponse {
  error: string
  code: string
}

export default function Register() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const [quoteIndex, setQuoteIndex] = useState<number | null>(null)

  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * 15))
  }, [])

  if (quoteIndex === null) return null

  const handleRegister = async (name: string, phone: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, phone, email, password }),
      })

      const data: ErrorResponse | { message: string } = await response.json()

      if (!response.ok) {
        if ("code" in data) {
          throw { message: data.error, code: data.code }
        }
        throw new Error("Registration failed")
      }

      toast.success("Registration successful! Please check your email to verify your account.")
      router.push("/login")
    } catch (error) {
      if (error && typeof error === "object" && "code" in error) {
        const { code, message } = error as { code: string; message: string }
        switch (code) {
          case "EMAIL_REGISTERED_NOT_VERIFIED":
          case "PHONE_REGISTERED_NOT_VERIFIED":
            toast.error(message, {
              action: {
                label: "Resend verification email",
                onClick: () =>
                  handleResendVerification(email, code === "EMAIL_REGISTERED_NOT_VERIFIED" ? "email" : "phone"),
              },
            })
            break
          case "EMAIL_REGISTERED":
            toast.error("This email is already registered. Please use a different email or try logging in.")
            break
          case "PHONE_REGISTERED":
            toast.error("This phone number is already registered. Please use a different number or try logging in.")
            break
          case "INVALID_PHONE":
            toast.error("Please enter a valid phone number.")
            break
          case "SERVER_ERROR":
            toast.error("An unexpected error occurred. Please try again later.")
            break
          default:
            toast.error(message || "An unexpected error occurred. Please try again.")
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, loginMethod }),
      })

      if (response.ok) {
        toast.success("Verification email sent successfully. Please check your inbox.")
      } else {
        const data = await response.json()
        throw new Error(data.error)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resend verification email")
    }
  }

  return <RegisterPage handleRegister={handleRegister} isLoading={isLoading} quoteIndex={quoteIndex} />
}

