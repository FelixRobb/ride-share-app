'use client'

import { useState } from "react"
import { useRouter } from 'next/navigation'
import LoginPage from '@/components/LoginPage'
import { toast } from "sonner"
import { User } from "@/types"
import { fetchUserData } from "@/utils/api"

export default function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  

  const handleLogin = async (identifier: string, password: string, loginMethod: 'email' | 'phone') => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password, loginMethod }),
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      localStorage.setItem("currentUser", JSON.stringify(data.user))
      localStorage.setItem("theme", "dark")
      await fetchUserData(data.user.id, null)
      router.push('/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
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

