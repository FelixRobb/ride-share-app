"use client"

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

import Layout from "@/components/Layout"
import type { User, Ride, Contact } from "@/types"
import { fetchDashboardData } from "@/utils/api"
import { useOnlineStatus } from "@/utils/useOnlineStatus"
import { Loader } from "lucide-react"

const DashboardPage = dynamic(() => import("@/components/DashboardPage"), { ssr: false })

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<{ rides: Ride[]; contacts: Contact[] } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("active") // default tab
  const [showLoader, setShowLoader] = useState(false)

  const router = useRouter()
  const isOnline = useOnlineStatus()
  const { data: session, status } = useSession()
  const currentUser = session?.user as User | undefined

  useEffect(() => {
    const fetchData = async () => {
      if (isOnline && currentUser) {
        try {
          const data = await fetchDashboardData()
          setDashboardData(data)
        } catch {
          toast.error("Failed to fetch dashboard data. Please try again.")
        }
      }
    }

    fetchData()
    const intervalId = setInterval(fetchData, 10000) // Refresh every 10 seconds
    return () => clearInterval(intervalId)
  }, [isOnline, currentUser])

  useEffect(() => {
    const search = new URLSearchParams(window.location.search)
    if (search) {
      setActiveTab(search.get("tab") || "active")
    }
  }, [])

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
      <Suspense fallback={<div className="p-4 text-center">Hold on... Fetching your dashboard</div>}>
        {dashboardData && (
          <DashboardPage
            currentUser={currentUser}
            rides={dashboardData.rides}
            contacts={dashboardData.contacts}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}
      </Suspense>
    </Layout>
  )
}

