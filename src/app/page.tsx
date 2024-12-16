'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import WelcomePage from '@/components/WelcomePage'
import { Loader } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkUser = () => {
      const currentUser = localStorage.getItem('currentUser')
      if (currentUser) {
        console.log(currentUser)
        router.push('/dashboard')
      } else {
        console.log("No user found")
        setIsLoading(false)
      }
    }

    checkUser()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return <WelcomePage />
}

