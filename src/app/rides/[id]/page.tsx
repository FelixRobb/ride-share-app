"use client"

import { ArrowBigLeft, Loader } from "lucide-react"
import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import { useParams } from "next/navigation"
import { useState, useEffect, Suspense, useCallback } from "react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import type { User, Ride, Contact } from "@/types"
import { fetchUserData, fetchRideDetails } from "@/utils/api"
import { useOnlineStatus } from "@/utils/useOnlineStatus"

const RideDetailsPage = dynamic(() => import("@/components/RideDetailsPage"), { ssr: false })

export default function RideDetails() {
  const [ride, setRide] = useState<Ride | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [etag, setEtag] = useState<string | null>(null)

  const router = useRouter()
  const { id } = useParams()
  const searchParams = useSearchParams()
  const fromTab = searchParams.get("from") || "available"
  const isOnline = useOnlineStatus()
  const { data: session, status } = useSession()
  const currentUser = session?.user as User | null
  const isFromRideHistory = fromTab === "ride-history"
  const [showLoader, setShowLoader] = useState(false)

  const fetchUserDataCallback = useCallback(
    async (userId: string) => {
      if (isOnline) {
        try {
          const result = await fetchUserData(userId, etag)
          if (result) {
            const { data, newEtag } = result
            setEtag(newEtag)
            setContacts(data.contacts)
          }
        } catch {
          toast.error("Failed to fetch user data. Please try again.")
        }
      }
    },
    [isOnline, etag],
  )

  const fetchRideDetailsCallback = useCallback(
    async (rideId: string) => {
      if (isOnline && currentUser) {
        try {
          const rideDetails = await fetchRideDetails(currentUser.id, rideId)
          setRide(rideDetails)
        } catch {
          toast.error("Failed to fetch ride details, or you don't have permission to see this ride. Please go back.")
        }
      }
    },
    [isOnline, currentUser],
  )

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && currentUser && id) {
      void fetchUserDataCallback(currentUser.id)
      void fetchRideDetailsCallback(id as string)
    }
  }, [status, currentUser, id, router, fetchUserDataCallback, fetchRideDetailsCallback])

  useEffect(() => {
    if (currentUser && id) {
      const intervalId = setInterval(() => {
        void fetchRideDetailsCallback(id as string)
      }, 10000)
      return () => clearInterval(intervalId)
    }
  }, [currentUser, fetchRideDetailsCallback, id])

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
          <div className="flex items-center justify-center w-full"><Loader /></div>
          <p className="mt-4 text-lg text-white">Please wait while we are checking your authentication status...</p>
        </div>
      )
    }
    return <div className="bg-black h-screen" /> // Show black screen initially
  }

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  return (
    <Layout>
      <Button type="button" variant="ghost" onClick={() => router.push(isFromRideHistory ? "/ride-history" : `/dashboard?tab=${fromTab}`)} className="mb-2">
        <ArrowBigLeft />
        {isFromRideHistory ? "Back to Ride History" : "Go Back to Dashboard"}
      </Button>
      <Suspense fallback={<div className="p-4 text-center">Hold on... Fetching ride details</div>}>
        {ride && currentUser && (
          <RideDetailsPage
            ride={ride}
            currentUser={currentUser}
            contacts={contacts}
            fetchUserData={() => fetchUserDataCallback(currentUser.id)}
          />
        )}
      </Suspense>
    </Layout>
  )
}

