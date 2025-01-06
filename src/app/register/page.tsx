'use client'

import { useState } from "react"
import { useRouter } from 'next/navigation'
import RegisterPage from '@/components/RegisterPage'
import { useToast } from "@/hooks/use-toast"
import { User } from "@/types"
import { register, fetchUserData } from "@/utils/api"

export default function Register() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleRegister = async (name: string, phone: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      const user = await register(name, phone, email, password)
      localStorage.setItem("currentUser", JSON.stringify(user))
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
    <RegisterPage
      setCurrentUser={(user: User) => {
        localStorage.setItem("currentUser", JSON.stringify(user))
      }}
      handleRegister={handleRegister}
      isLoading={isLoading}
    />
  )
}