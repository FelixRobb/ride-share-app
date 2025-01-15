'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Layout from '@/components/Layout'
import { toast } from "sonner"
import { Loader } from 'lucide-react'
import { User, Contact, AssociatedPerson, UserStats, Notification } from "@/types"
import { fetchUserData } from "@/utils/api"
import { useOnlineStatus } from "@/utils/useOnlineStatus"
import { TutorialProvider } from '@/contexts/TutorialContext'

const ProfilePage = dynamic(() => import('@/components/ProfilePage'), { ssr: false });

export default function Profile() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [associatedPeople, setAssociatedPeople] = useState<AssociatedPerson[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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
          setUserStats(data.stats)
        }
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast.error("Failed to fetch user data. Please try again.");
      }
    }
  }, [etag, toast, isOnline])

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (user) {
      const parsedUser = JSON.parse(user) as User
      setCurrentUser(parsedUser)
      void fetchUserDataCallback(parsedUser.id)
    } else {
      router.push('/')
    }
  }, [router, fetchUserDataCallback])

  useEffect(() => {
    if (currentUser) {
      const intervalId = setInterval(() => {
        void fetchUserDataCallback(currentUser.id)
      }, 20000)
      return () => clearInterval(intervalId)
    }
  }, [currentUser, fetchUserDataCallback])

  const logout = () => {
    localStorage.removeItem("currentUser")
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <TutorialProvider>
      <Layout currentUser={currentUser} logout={logout}>
        <Suspense fallback={<div className="p-4 text-center">Hold on... Fetching your profile</div>}>
          {currentUser && (
            <ProfilePage
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              contacts={contacts}
              associatedPeople={associatedPeople}
              userStats={userStats}
              fetchUserData={fetchUserDataCallback}
            />
          )}
        </Suspense>
      </Layout>
    </TutorialProvider>
  )
}

