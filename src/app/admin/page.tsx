'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminDashboard from '@/components/AdminDashboard'
import AdminLogin from '@/components/AdminLogin'
import { toast } from "sonner"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const adminAuth = localStorage.getItem('adminAuth')
      if (adminAuth === 'true') {
        setIsAuthenticated(true)
      }
    }

    checkAuth()
  }, [])

  const handleLogin = async (password: string) => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        localStorage.setItem('adminAuth', 'true')
        setIsAuthenticated(true)
      } else {
        toast.error("Invalid password");
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error("An error occurred during login");
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminAuth')
    setIsAuthenticated(false)
    router.push('/')
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />
  }

  return <AdminDashboard onLogout={handleLogout} />
}

