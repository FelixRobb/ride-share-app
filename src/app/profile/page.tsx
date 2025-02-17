"use client"

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback, Suspense } from "react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { Loader } from "lucide-react"

import Layout from "@/components/Layout"
import type { User, Contact, AssociatedPerson } from "@/types"
import { fetchUserData } from "@/utils/api"
import { useOnlineStatus } from "@/utils/useOnlineStatus"

const ProfilePage = dynamic(() => import("@/components/ProfilePage"), { ssr: false })

export default function Profile() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [associatedPeople, setAssociatedPeople] = useState<AssociatedPerson[]>([])
  const [etag, setEtag] = useState<string | null>(null)

  const router = useRouter()
  const isOnline = useOnlineStatus()
  const { data: session, status } = useSession()
  const currentUser = session?.user as User | undefined
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
      }, 20000)
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

  if (!currentUser) {
    return <div>Error: User not found</div>
  }

  return (
    <Layout>
      <Suspense fallback={<div className="p-4 text-center">Hold on... Fetching your profile</div>}>
        <ProfilePage
          currentUser={currentUser}
          contacts={contacts}
          associatedPeople={associatedPeople}
          fetchUserData={() => fetchUserDataCallback(currentUser.id)}
        />
      </Suspense>
    </Layout>
  )
}

