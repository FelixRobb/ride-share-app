"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import Layout from "@/components/Layout"
import { toast } from "sonner"
import type { User, Ride } from "@/types"
import { fetchRideDetails } from "@/utils/api"
import dynamic from "next/dynamic"
import { useOnlineStatus } from "@/utils/useOnlineStatus"

const EditRidePage = dynamic(() => import("@/components/EditRidePage"), { ssr: false })

export default function EditRide() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [ride, setRide] = useState<Ride | null>(null)

  const router = useRouter()
  const { id } = useParams()
  const isOnline = useOnlineStatus()

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (user) {
      const parsedUser = JSON.parse(user) as User
      setCurrentUser(parsedUser)
      void fetchRideDetailsCallback(parsedUser.id, id as string)
    } else {
      router.push("/")
    }
  }, [router, id])

  const fetchRideDetailsCallback = async (userId: string, rideId: string) => {
    if (isOnline) {
      try {
        const rideDetails = await fetchRideDetails(userId, rideId)
        setRide(rideDetails)
        if (rideDetails.status !== "pending" || rideDetails.requester_id !== userId) {
          toast.error("You can't edit this ride.")
          router.push(`/rides/${rideId}`)
        }
      } catch (error) {
        console.error("Error fetching ride details:", error)
        toast.error("Failed to fetch ride details. Please try again.")
        router.push("/dashboard")
      }
    }
  }

  if (!currentUser || !ride) {
    return <div>Loading...</div>
  }

  return (
    <Layout currentUser={currentUser}>
      <EditRidePage currentUser={currentUser} rideId={id as string} />
    </Layout>
  )
}

