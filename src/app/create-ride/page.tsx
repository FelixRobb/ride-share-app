"use client"

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { Loader } from "lucide-react"

import Layout from "@/components/Layout"
import type { User, AssociatedPerson } from "@/types"
import { fetchCreateRideData } from "@/utils/api"
import { useOnlineStatus } from "@/utils/useOnlineStatus"

const CreateRidePage = dynamic(() => import("@/components/CreateRidePage"), { ssr: false })

export default function CreateRide() {
  const [createRideData, setCreateRideData] = useState<{ associatedPeople: AssociatedPerson[] } | null>(null)

  const router = useRouter()
  const isOnline = useOnlineStatus()
  const { data: session, status } = useSession()
  const currentUser = session?.user as User | null
  const [showLoader, setShowLoader] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (isOnline && currentUser) {
        try {
          const data = await fetchCreateRideData()
          setCreateRideData(data)
        } catch {
          toast.error("Failed to fetch user data. Please try again.")
        }
      }
    }

    fetchData()
  }, [isOnline, currentUser])

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
      <Suspense fallback={<div className="p-4 text-center">Hold on... Fetching ride details</div>}>
        {createRideData && currentUser && (
          <CreateRidePage
            currentUser={currentUser}
            associatedPeople={createRideData.associatedPeople}
          />
        )}
      </Suspense>
    </Layout>
  )
}

