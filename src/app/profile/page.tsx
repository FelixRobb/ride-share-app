"use client"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Loader } from "lucide-react"
import Layout from "@/components/Layout"
import type { User } from "@/types"

const ProfilePage = dynamic(() => import("@/components/ProfilePage"), { ssr: false })

export default function Profile() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const currentUser = session?.user as User | undefined
  const [showLoader, setShowLoader] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  if (status === "loading") {
    if (showLoader) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-black">
          <div className="flex items-center justify-center w-full">
            <Loader className="animate-spin" />
          </div>
          <p className="mt-4 text-lg text-white">Please wait while we are checking your authentication status...</p>
        </div>
      )
    }
    return <div className="bg-black h-screen" />
  }

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  if (!currentUser) {
    return <div>Error: User not found</div>
  }

  return (
    <Layout>
      <ProfilePage currentUser={currentUser} />
    </Layout>
  )
}

