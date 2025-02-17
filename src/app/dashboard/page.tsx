"use client"

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useState, useEffect, Suspense, useCallback } from "react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

import Layout from "@/components/Layout"
import type { User, Ride, Contact } from "@/types"
import { fetchUserData } from "@/utils/api"
import { useOnlineStatus } from "@/utils/useOnlineStatus"
import { Loader } from "lucide-react"

const DashboardPage = dynamic(() => import("@/components/DashboardPage"), { ssr: false })

export default function Dashboard() {
  const [rides, setRides] = useState<Ride[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [etag, setEtag] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("active") // default tab
  const [showLoader, setShowLoader] = useState(false)

  const router = useRouter()
  const isOnline = useOnlineStatus()
  const { data: session, status } = useSession()
  const currentUser = session?.user as User | undefined

  const fetchUserDataCallback = useCallback(
    async (userId: string) => {
      if (isOnline) {
        try {
          const result = await fetchUserData(userId, etag)
          if (result) {
            const { data, newEtag } = result

            // Conditionally update the states to avoid unnecessary re-renders.
            if (newEtag !== etag) {
              setEtag(newEtag)
              setRides(data.rides)
              setContacts(data.contacts)
            }
          }
        } catch {
          toast.error("Failed to fetch user data. Please try again.")
        }
      }
    },
    [etag, isOnline],
  )

  useEffect(() => {
    const search = new URLSearchParams(window.location.search)
    if (search) {
      setActiveTab(search.get("tab") || "active")
    }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && currentUser) {
      void fetchUserDataCallback(currentUser.id)
    }
  }, [status, currentUser, router, fetchUserDataCallback])

  useEffect(() => {
    if (currentUser) {
      const intervalId = setInterval(() => {
        void fetchUserDataCallback(currentUser.id)
      }, 10000)
      return () => clearInterval(intervalId)
    }
  }, [currentUser, fetchUserDataCallback])

  // Set a timeout to show the loader after 3 seconds
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
          <div className="flex items-center justify-center w-full"><Loader /></div>
          <p className="mt-4 text-lg text-white">Please wait while we are checking your authentication status...</p>
        </div>
      )
    }
    return <div className="bg-black h-screen" /> // Show black screen initially
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
      <Suspense fallback={<div className="p-4 text-center">Hold on... Fetching your dashboard</div>}>
        <DashboardPage
          currentUser={currentUser}
          rides={rides}
          contacts={contacts}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          fetchUserData={() => fetchUserDataCallback(currentUser.id)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </Suspense>
    </Layout>
  )
}

