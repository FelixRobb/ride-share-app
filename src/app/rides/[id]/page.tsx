"use client"

import { ArrowBigLeft, Loader } from "lucide-react"
import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense, useCallback, useRef } from "react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { use } from "react"

import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import type { User, Ride, Contact } from "@/types"
import { fetchRideDetailsData } from "@/utils/api"
import { useOnlineStatus } from "@/utils/useOnlineStatus"

const RideDetailsPage = dynamic(() => import("@/components/RideDetailsPage"), { ssr: false })

export default function RideDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { id } = resolvedParams

  const [rideDetailsData, setRideDetailsData] = useState<{ ride: Ride; contacts: Contact[]; user: User } | null>(null)
  const etagRef = useRef<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const fromTab = searchParams.get("from") || "available"
  const isOnline = useOnlineStatus()
  const { data: session, status } = useSession()
  const currentUser = session?.user as User | null
  const [showLoader, setShowLoader] = useState(false)

  const fetchRideData = useCallback(async () => {
    if (isOnline && currentUser && id) {
      try {
        const result = await fetchRideDetailsData(currentUser.id, id, etagRef.current)
        if (result) {
          const { data, newEtag } = result
          setRideDetailsData(data)
          etagRef.current = newEtag
        }
      } catch {
        toast.error("Failed to fetch ride details. Please try again.")
      }
    }
  }, [isOnline, currentUser, id])

  useEffect(() => {
    if (status === "authenticated") {
      fetchRideData()
      const intervalId = setInterval(fetchRideData, 10000) // Fetch every 10 seconds
      return () => clearInterval(intervalId)
    } else if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, fetchRideData, router])

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

  if (!currentUser || !rideDetailsData) {
    return <div>Loading...</div>
  }

  return (
    <Layout>
      <Button type="button" variant="ghost" onClick={() => router.push(`/dashboard?tab=${fromTab}`)} className="mb-2">
        <ArrowBigLeft />
        Go Back to Dashboard
      </Button>
      <Suspense fallback={<div className="p-4 text-center">Hold on... Fetching ride details</div>}>
        <RideDetailsPage
          rideData={rideDetailsData}
          currentUser={currentUser}
          rideId={id}
          onDataUpdate={fetchRideData}
        />
      </Suspense>
    </Layout>
  )
}