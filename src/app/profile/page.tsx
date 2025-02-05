'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { toast } from "sonner"

import Layout from '@/components/Layout'
import { User, Contact, AssociatedPerson } from "@/types"
import { fetchUserData } from "@/utils/api"
import { useOnlineStatus } from "@/utils/useOnlineStatus"

const ProfilePage = dynamic(() => import('@/components/ProfilePage'), { ssr: false });

export default function Profile() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [associatedPeople, setAssociatedPeople] = useState<AssociatedPerson[]>([])
  const [etag, setEtag] = useState<string | null>(null)

  const router = useRouter()
  const isOnline = useOnlineStatus()

  const fetchUserDataCallback = useCallback(async (userId: string) => {
    if (isOnline) {
      try {
        const result = await fetchUserData(userId, etag)
        if (result) {
          const { data, newEtag } = result
          setEtag(newEtag)
          setContacts(data.contacts)
          setAssociatedPeople(data.associatedPeople)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast.error("Failed to fetch user data. Please try again.");
      }
    }
  }, [etag, isOnline])

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user")
        if (response.ok) {
          const userData = await response.json()
          setCurrentUser(userData)
          void fetchUserDataCallback(userData.id) // Fetch initial data after getting user data from /api/user
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
  }, [router, fetchUserDataCallback])

  useEffect(() => {
    if (currentUser) {
      const intervalId = setInterval(() => {
        void fetchUserDataCallback(currentUser.id)
      }, 20000)
      return () => clearInterval(intervalId)
    }
  }, [currentUser, fetchUserDataCallback])


  return (
    <Layout>
      <Suspense fallback={<div className="p-4 text-center">Hold on... Fetching your profile</div>}>
        {currentUser && (
          <ProfilePage
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            contacts={contacts}
            associatedPeople={associatedPeople}
            fetchUserData={fetchUserDataCallback}
          />
        )}
      </Suspense>
    </Layout>
  )
}

