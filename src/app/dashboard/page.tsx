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

const DashboardPage = dynamic(() => import("@/components/DashboardPage"), { ssr: false })

export default function Dashboard() {
  const [rides, setRides] = useState<Ride[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [etag, setEtag] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("active") // default tab

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

  if (status === "loading") {
    return <div>Loading...</div>
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

