"use client"

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { toast } from "sonner"

import Layout from "@/components/Layout"
import type { User, Ride } from "@/types"
import { fetchRideDetails } from "@/utils/api"
import { useOnlineStatus } from "@/utils/useOnlineStatus"

const EditRidePage = dynamic(() => import("@/components/EditRidePage"), { ssr: false })

export default function EditRide() {
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [ride, setRide] = useState<Ride | null>(null)

    const router = useRouter()
    const { id } = useParams()
    const isOnline = useOnlineStatus()

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
                } catch (error) {
                    console.error("Error fetching ride details:", error)
                    toast.error("Failed to fetch ride details. Please try again.")
                    router.push("/dashboard")
                }
            }
        }

        const user = localStorage.getItem("currentUser")
        if (user) {
            const parsedUser = JSON.parse(user) as User
            setCurrentUser(parsedUser)
            void fetchRideDetailsCallback(parsedUser.id, id as string)
        } else {
            router.push("/")
        }
    }, [router, id, isOnline])



    return (
        <Layout currentUser={currentUser}>
            <Suspense fallback={<div className="p-4 text-center">Hold on... Fetching ride details</div>}>
                {ride && currentUser && (
                    <EditRidePage currentUser={currentUser} rideId={id as string} />
                )}
            </Suspense>
        </Layout >
    )
}

