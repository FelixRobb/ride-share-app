'use client'

import { useState, useEffect } from 'react'
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

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (user) {
      const parsedUser = JSON.parse(user) as User
      setCurrentUser(parsedUser)
      void fetchUserDataCallback(parsedUser.id)
    } else {
      router.push('/')
    }
  }, [router])

  const fetchUserDataCallback = async (userId: string) => {
    try {
      const result = await fetchUserData(userId, etag)
      if (result) {
        const { data, newEtag } = result
        setEtag(newEtag)
        setContacts(data.contacts)
        setAssociatedPeople(data.associatedPeople)
        setUserStats(data.stats)
        setNotifications((prev) => [...prev, ...data.notifications])
        // Handle other data updates as needed
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
  }

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
        fetchUserData={() => fetchUserDataCallback(currentUser!.id)}
      />
    </Layout>
  )
}

