"use client"

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { Suspense } from "react"

import Layout from "@/components/Layout"
import type { User, Ride, Contact } from "@/types"
import { fetchDashboardData } from "@/utils/api"
import { useOnlineStatus } from "@/utils/useOnlineStatus"
import { Loader } from 'lucide-react'

const DashboardPage = dynamic(() => import("@/components/DashboardPage"), { ssr: false })

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<{ rides: Ride[]; contacts: Contact[]; user: User } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("active")
  const [showLoader, setShowLoader] = useState(false)

  const router = useRouter()
  const isOnline = useOnlineStatus()
  const { data: session, status } = useSession()
  const currentUser = session?.user as User | undefined

  // Use refs for values that shouldn't trigger re-renders
  const etagRef = useRef<string | null>(null)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // Stable fetch function that doesn't depend on changing values
  const fetchData = useCallback(async () => {
    if (!isOnline || !currentUser || !isMountedRef.current) return

    try {
      const result = await fetchDashboardData(currentUser.id, etagRef.current)
      if (result && isMountedRef.current) {
        const { data, newEtag } = result
        etagRef.current = newEtag
        setDashboardData(data)
      }
    } catch {
      if (isMountedRef.current) {
        toast.error("Failed to fetch dashboard data. Please try again.")
      }
    }
  }, [currentUser, isOnline]) // Minimal dependencies

  // Handle URL params
  useEffect(() => {
    const search = new URLSearchParams(window.location.search)
    const tabFromUrl = search.get("tab")
    if (tabFromUrl) {
      setActiveTab(tabFromUrl)
    }
  }, [])

  // Main data fetching effect
  useEffect(() => {
    isMountedRef.current = true

    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated" && currentUser) {
      // Initial fetch
      fetchData()

      // Setup polling
      const startPolling = () => {
        fetchTimeoutRef.current = setTimeout(async () => {
          await fetchData()
          if (isMountedRef.current) {
            startPolling()
          }
        }, 10000)
      }

      startPolling()
    }

    // Cleanup
    return () => {
      isMountedRef.current = false
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [status, currentUser, router, fetchData])

  // Loader effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        setShowLoader(true)
      }
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

  if (!currentUser || !dashboardData) {
    return <div>Loading...</div>
  }

  return (
    <Layout>
      <Suspense fallback={<div className="p-4 text-center">Hold on... Fetching your dashboard</div>}>
        <DashboardPage
          currentUser={dashboardData.user}
          rides={dashboardData.rides}
          contacts={dashboardData.contacts}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </Suspense>
    </Layout>
  )
}