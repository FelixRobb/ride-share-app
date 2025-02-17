"use client"

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useState, useEffect, Suspense, useCallback } from "react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { Loader } from "lucide-react"

import Layout from "@/components/Layout"
import type { User, AssociatedPerson } from "@/types"
import { fetchUserData } from "@/utils/api"
import { useOnlineStatus } from "@/utils/useOnlineStatus"

const CreateRidePage = dynamic(() => import("@/components/CreateRidePage"), { ssr: false })

export default function CreateRide() {
  const [associatedPeople, setAssociatedPeople] = useState<AssociatedPerson[]>([])
  const [etag, setEtag] = useState<string | null>(null)

  const router = useRouter()
  const isOnline = useOnlineStatus()
  const { data: session, status } = useSession()
  const currentUser = session?.user as User | null
  const [showLoader, setShowLoader] = useState(false)

  const fetchUserDataCallback = useCallback(
    async (userId: string) => {
      if (isOnline) {
        try {
          const result = await fetchUserData(userId, etag)
          if (result) {
            const { data, newEtag } = result
            setEtag(newEtag)
            setAssociatedPeople(data.associatedPeople)
          }
        } catch {
          toast.error("Failed to fetch user data. Please try again.")
        }
      }
    },
    [etag, isOnline],
  )

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && currentUser) {
      void fetchUserDataCallback(currentUser.id)
    }
  }, [status, currentUser, router, fetchUserDataCallback])

  useEffect(() => {
    if (currentUser) {
      const intervalId = setInterval(() => {
        void fetchUserDataCallback(currentUser.id)
      }, 10000)
      return () => clearInterval(intervalId)
    }
  }, [currentUser, fetchUserDataCallback])

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
      <Suspense fallback={<div className="p-4 text-center">Hold on... Fetching ride details</div>}>
        {currentUser && (
          <CreateRidePage
            currentUser={currentUser}
            fetchUserData={() => fetchUserDataCallback(currentUser.id)}
            setCurrentPage={(page) => router.push(`/${page}`)}
            associatedPeople={associatedPeople}
          />
        )}
      </Suspense>
    </Layout>
  )
}

