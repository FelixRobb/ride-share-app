'use client'

import { useState } from "react"
import { useRouter } from 'next/navigation'
import LoginPage from '@/components/LoginPage'
import { useToast } from "@/hooks/use-toast"
import { User } from "@/types"
import { login, fetchUserData } from "@/utils/api"

export default function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (phoneOrEmail: string, password: string) => {
    setIsLoading(true)
    try {
      const user = await login(phoneOrEmail, password)
      localStorage.setItem("currentUser", JSON.stringify(user))
      localStorage.setItem("theme", "dark")
      await fetchUserData(user.id, null)
      router.push('/dashboard')
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <LoginPage
      setCurrentUser={(user: User) => {
        localStorage.setItem("currentUser", JSON.stringify(user))
      }}
      handleLogin={handleLogin}
      isLoading={isLoading}
    />
  )
}

