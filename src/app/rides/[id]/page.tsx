"use client"

import { ArrowBigLeft, Loader } from "lucide-react"
import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import { useParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import type { User, Ride, Contact } from "@/types"
import { fetchRideDetailsData } from "@/utils/api"
import { useOnlineStatus } from "@/utils/useOnlineStatus"

const RideDetailsPage = dynamic(() => import("@/components/RideDetailsPage"), { ssr: false })

export default function RideDetails() {
  const [rideData, setRideData] = useState<{ ride: Ride; contacts: Contact[] } | null>(null)

  const router = useRouter()
  const { id } = useParams()
  const searchParams = useSearchParams()
  const fromTab = searchParams.get("from") || "available"
  const isOnline = useOnlineStatus()
  const { data: session, status } = useSession()
  const currentUser = session?.user as User | null
  const [showLoader, setShowLoader] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (isOnline && currentUser && id) {
        try {
          const data = await fetchRideDetailsData(id as string)
          setRideData(data)
        } catch {
          toast.error("Failed to fetch ride details. Please try again.")
        }
      }
    }

    fetchData()
    const intervalId = setInterval(fetchData, 10000) // Refresh every 10 seconds
    return () => clearInterval(intervalId)
  }, [isOnline, currentUser, id, router])

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

  return (
    <Layout>
      <Button type="button" variant="ghost" onClick={() => router.push(`/dashboard?tab=${fromTab}`)} className="mb-2">
        <ArrowBigLeft />
        Go Back to Dashboard
      </Button>
      <Suspense fallback={<div className="p-4 text-center">Hold on... Fetching ride details</div>}>
        {rideData && currentUser && (
          <RideDetailsPage ride={rideData.ride} currentUser={currentUser} contacts={rideData.contacts} />
        )}
      </Suspense>
    </Layout>
  )
}

