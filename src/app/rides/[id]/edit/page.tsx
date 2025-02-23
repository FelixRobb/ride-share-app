"use client"

import dynamic from "next/dynamic"
import { useRouter, useParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

import Layout from "@/components/Layout"
import type { User, Ride } from "@/types"
import { fetchRideDetailsData } from "@/utils/api"
import { useOnlineStatus } from "@/utils/useOnlineStatus"
import { Loader } from "lucide-react"

const EditRidePage = dynamic(() => import("@/components/EditRidePage"), { ssr: false })

export default function EditRide() {
  const [rideData, setRideData] = useState<{ ride: Ride } | null>(null)
  const [etag, setEtag] = useState<string | null>(null)

  const router = useRouter()
  const { id } = useParams()
  const isOnline = useOnlineStatus()
  const { data: session, status } = useSession()
  const currentUser = session?.user as User | undefined
  const [showLoader, setShowLoader] = useState(false)

  useEffect(() => {
    const fetchRideDetailsCallback = async (userId: string, rideId: string) => {
      if (isOnline) {
        try {
          const result = await fetchRideDetailsData(userId, rideId, etag)
          if (result) {
            const { data, newEtag } = result
            setEtag(newEtag)
            setRideData(data)
            if (data.ride.status !== "pending" || data.ride.requester_id !== userId) {
              toast.error("You can't edit this ride.")
              router.push(`/rides/${rideId}`)
            }
          }
        } catch {
          toast.error("Failed to fetch ride details. Please try again.")
          router.push("/dashboard")
        }
      }
    }

    if (status === "authenticated" && currentUser) {
      void fetchRideDetailsCallback(currentUser.id, id as string)
    } else if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [router, id, isOnline, status, currentUser, etag])

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

  if (!currentUser || !rideData) {
    return <div>Loading...</div>
  }

  return (
    <Layout>
      <Suspense fallback={<div className="p-4 text-center">Hold on... Fetching ride details</div>}>
        <EditRidePage currentUser={currentUser} ride={rideData.ride} />
      </Suspense>
    </Layout>
  )
}

