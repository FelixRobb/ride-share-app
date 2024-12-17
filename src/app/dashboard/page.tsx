'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardPage from '@/components/DashboardPage'
import Layout from '@/components/Layout'
import { Loader } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { User, Ride, Contact, Notification } from "@/types"
import { fetchUserData } from "@/utils/api"

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [rides, setRides] = useState<Ride[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
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
        setRides(data.rides)
        setContacts(data.contacts)
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
      <DashboardPage
        currentUser={currentUser!}
        rides={rides}
        contacts={contacts}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        fetchUserData={() => fetchUserDataCallback(currentUser!.id)}
      />
    </Layout>
  )
}

