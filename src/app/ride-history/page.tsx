"use client"

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { Suspense } from "react"

import Layout from "@/components/Layout"
import type { User, Ride } from "@/types"
import { fetchRideHistoryData } from "@/utils/api"
import { useOnlineStatus } from "@/utils/useOnlineStatus"
import { Loader } from "lucide-react"

const RideHistoryPage = dynamic(() => import("@/components/RideHistoryPage"), { ssr: false })

export default function RideHistory() {
  const [rideHistoryData, setRideHistoryData] = useState<{ rides: Ride[] } | null>(null)
  const [etag, setEtag] = useState<string | null>(null)
  const [showLoader, setShowLoader] = useState(false)

  const router = useRouter()
  const isOnline = useOnlineStatus()
  const { data: session, status } = useSession()
  const currentUser = session?.user as User | undefined

  const fetchRideHistoryDataCallback = useCallback(
    async (userId: string) => {
      if (isOnline) {
        try {
          const result = await fetchRideHistoryData(userId, etag)
          if (result) {
            const { data, newEtag } = result
            setEtag(newEtag)
            setRideHistoryData(data)
          }
        } catch {
          toast.error("Failed to fetch ride history data. Please try again.")
        }
      }
    },
    [etag, isOnline],
  )

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && currentUser) {
      void fetchRideHistoryDataCallback(currentUser.id)
    }
  }, [status, currentUser, router, fetchRideHistoryDataCallback])

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

  if (!currentUser || !rideHistoryData) {
    return <div>Loading...</div>
  }

  return (
    <Layout>
      <Suspense fallback={<div className="p-4 text-center">Hold on... Fetching your ride history</div>}>
        <RideHistoryPage
          currentUser={currentUser}
          rides={rideHistoryData.rides}
          fetchRideHistoryData={() => fetchRideHistoryDataCallback(currentUser.id)}
        />
      </Suspense>
    </Layout>
  )
}

