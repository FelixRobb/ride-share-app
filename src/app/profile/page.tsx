"use client"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useState, useEffect, Suspense, useCallback } from "react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { Loader } from "lucide-react"
import Layout from "@/components/Layout"
import type { User, Contact, AssociatedPerson } from "@/types"
import { fetchProfileData } from "@/utils/api"
import { useOnlineStatus } from "@/utils/useOnlineStatus"

const ProfilePage = dynamic(() => import("@/components/ProfilePage"), { ssr: false })

export default function Profile() {
  const [profileData, setProfileData] = useState<{
    user: User
    contacts: Contact[]
    associatedPeople: AssociatedPerson[]
  } | null>(null)
  const router = useRouter()
  const isOnline = useOnlineStatus()
  const { data: session, status } = useSession()
  const currentUser = session?.user as User | undefined
  const [showLoader, setShowLoader] = useState(false)
  
  // Wrap fetchData in useCallback
  const fetchData = useCallback(async () => {
    if (isOnline && currentUser) {
      try {
        const data = await fetchProfileData()
        setProfileData(data)
      } catch {
        toast.error("Failed to fetch profile data. Please try again.")
      }
    }
  }, [isOnline, currentUser])

  useEffect(() => {
    fetchData()
    const intervalId = setInterval(fetchData, 20000) // Refresh every 20 seconds
    return () => clearInterval(intervalId)
  }, [fetchData])

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
            <Loader />
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
      <Suspense fallback={<div className="p-4 text-center">Hold on... Fetching your profile</div>}>
        {profileData && (
          <ProfilePage
            currentUser={profileData.user}
            contacts={profileData.contacts}
            associatedPeople={profileData.associatedPeople}
            refreshData={fetchData}
          />
        )}
      </Suspense>
    </Layout>
  )
}