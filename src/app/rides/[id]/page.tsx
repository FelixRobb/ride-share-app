"use client"

import { ArrowBigLeft, Loader } from "lucide-react"
import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import type { User } from "@/types"

const RideDetailsPage = dynamic(() => import("@/components/RideDetailsPage"), { ssr: false })

export default function RideDetails() {
  const router = useRouter()
  const { id } = useParams()
  const searchParams = useSearchParams()
  const fromTab = searchParams.get("from") || "available"
  const { data: session, status } = useSession()
  const currentUser = session?.user as User | null
  const [showLoader, setShowLoader] = useState(false)
  const isFromRideHistory = fromTab === "ride-history"

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
      <Button type="button" variant="ghost" onClick={() => router.push(isFromRideHistory ? "/ride-history" : `/dashboard?tab=${fromTab}`)} className="mb-2">
        <ArrowBigLeft />
                {isFromRideHistory ? "Back to Ride History" : "Go Back to Dashboard"}
      </Button>
      {currentUser && id && <RideDetailsPage currentUser={currentUser} rideId={id as string} />}
    </Layout>
  )
}

