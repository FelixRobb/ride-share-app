"use client"

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

import Layout from "@/components/Layout"
import type { User, Ride } from "@/types"
import { fetchRideDetails } from "@/utils/api"
import { useOnlineStatus } from "@/utils/useOnlineStatus"

const EditRidePage = dynamic(() => import("@/components/EditRidePage"), { ssr: false })

export default function EditRide() {
  const [ride, setRide] = useState<Ride | null>(null)

  const router = useRouter()
  const { id } = useParams()
  const isOnline = useOnlineStatus()
  const { data: session, status } = useSession()
  const currentUser = session?.user as User | undefined

  useEffect(() => {
    const fetchRideDetailsCallback = async (userId: string, rideId: string) => {
      if (isOnline) {
        try {
          const rideDetails = await fetchRideDetails(userId, rideId)
          setRide(rideDetails)
          if (rideDetails.status !== "pending" || rideDetails.requester_id !== userId) {
            toast.error("You can't edit this ride.")
            router.push(`/rides/${rideId}`)
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
  }, [router, id, isOnline, status, currentUser])

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
      <Suspense fallback={<div className="p-4 text-center">Hold on... Fetching ride details</div>}>
        {ride && <EditRidePage currentUser={currentUser} rideId={id as string} />}
      </Suspense>
    </Layout>
  )
}

