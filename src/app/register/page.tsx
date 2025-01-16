'use client'

import { useState } from "react"
import { useRouter } from 'next/navigation'
import RegisterPage from '@/components/RegisterPage'
import { toast } from "sonner"
import { User } from "@/types"
import { register, fetchUserData } from "@/utils/api"

export default function Register() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (name: string, phone: string, countryCode: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      const user = await register(name, phone, countryCode, email, password)
      localStorage.setItem("currentUser", JSON.stringify(user))
      await fetchUserData(user.id, null)
      router.push('/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred"); //Replaced toast call
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

