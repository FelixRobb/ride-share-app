'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ProfilePage from '@/components/ProfilePage'
import Layout from '@/components/Layout'
import { useToast } from "@/hooks/use-toast"
import { Loader } from 'lucide-react'
import { User, Contact, AssociatedPerson, UserStats, Notification } from "@/types"
import { fetchUserData } from "@/utils/api"

export default function Profile() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [associatedPeople, setAssociatedPeople] = useState<AssociatedPerson[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [etag, setEtag] = useState<string | null>(null)

  const router = useRouter()
  const { toast } = useToast()

  const fetchUserDataCallback = useCallback(async (userId: string) => {
    try {
      const result = await fetchUserData(userId, etag)
      if (result) {
        const { data, newEtag } = result
        setEtag(newEtag)
        setContacts(data.contacts)
        setAssociatedPeople(data.associatedPeople)
        setUserStats(data.stats)
        setNotifications((prev) => [...prev, ...data.notifications])
      }
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching user data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch user data. Please try again.",
        variant: "destructive",
      })
    }
  }, [etag, toast])

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
    const intervalId = setInterval(() => {
      if (currentUser) {
        void fetchUserDataCallback(currentUser.id)
      }
    }, 10000)
    return () => clearInterval(intervalId)
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
    <Layout currentUser={currentUser} notifications={notifications} logout={logout}>
      <ProfilePage
        currentUser={currentUser!}
        setCurrentUser={setCurrentUser}
        contacts={contacts}
        associatedPeople={associatedPeople}
        userStats={userStats}
        fetchUserData={fetchUserDataCallback}
      />
    </Layout>
  )
}
