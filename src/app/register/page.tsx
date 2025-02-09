"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"

import RegisterPage from "@/components/RegisterPage"

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

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Registration failed")
      }

      router.push("/dashboard")
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Email already registered")) {
          toast.error("This email is already registered. Please use a different email or try logging in.")
        } else if (error.message.includes("Phone number already registered")) {
          toast.error("This phone number is already registered. Please use a different number or try logging in.")
        } else if (error.message.includes("Invalid phone number")) {
          toast.error("Please enter a valid phone number.")
        } else {
          toast.error(error.message)
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return <RegisterPage handleRegister={handleRegister} isLoading={isLoading} quoteIndex={quoteIndex} />
}

