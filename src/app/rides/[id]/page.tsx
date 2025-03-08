"use client"

import { ArrowBigLeft } from "lucide-react"
import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import { useParams } from "next/navigation"
import AuthLoader from "@/components/AuthLoader"
import { useEffect } from "react"
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
  const isFromRideHistory = fromTab === "ride-history"

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])


  if (status === "loading") {
    return <AuthLoader />
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

