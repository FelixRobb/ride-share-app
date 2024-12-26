'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import WelcomePage from '@/components/WelcomePage'
import { Loader } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkUser = () => {
      const currentUser = localStorage.getItem('currentUser')
      if (currentUser) {
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
        <div className="flex flex-col gap-2 items-center justify-center h-screen">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground">RideShare</h1>
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div >

    )
  }

  return <WelcomePage />
}

