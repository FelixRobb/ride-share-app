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

        const fetchUserData = async () => {
            try {
                const response = await fetch("/api/user")
                if (response.ok) {
                    const userData = await response.json()
                    setCurrentUser(userData)
                    void fetchRideDetailsCallback(userData.id, id as string)
                } else {
                    throw new Error("Failed to fetch user data")
                }
            } catch (error) {
                console.error("Error fetching user data:", error)
                toast.error("Failed to load user data. Please try logging in again.")
                router.push("/")
            }
        }

        fetchUserData()
    }, [router, id, isOnline])

    return (
        <Layout>
            <Suspense fallback={<div className="p-4 text-center">Hold on... Fetching ride details</div>}>
                {ride && currentUser && (
                    <EditRidePage currentUser={currentUser} rideId={id as string} />
                )}
            </Suspense>
        </Layout >
    )
}

