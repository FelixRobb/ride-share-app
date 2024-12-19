'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardPage from '@/components/DashboardPage'
import Layout from '@/components/Layout'
import { Loader } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { User, Ride, Contact } from "@/types"
import { fetchUserData } from "@/utils/api"

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [rides, setRides] = useState<Ride[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [etag, setEtag] = useState<string | null>(null)

  const router = useRouter()
  const { toast } = useToast()

  const fetchUserDataCallback = useCallback(async (userId: string) => {
    console.log(`[fetchUserDataCallback] Starting for user ${userId}, current etag: ${etag}`)
    try {
      const result = await fetchUserData(userId, etag)
      console.log(`[fetchUserDataCallback] Received result:`, result)
      if (result) {
        const { data, newEtag } = result
        if (newEtag !== etag) {
          console.log(`[fetchUserDataCallback] New etag received: ${newEtag}`)
          setEtag(newEtag)
          if (data.rides) {
            console.log(`[fetchUserDataCallback] Setting rides:`, data.rides)
            setRides(data.rides)
          }
          if (data.contacts) {
            console.log(`[fetchUserDataCallback] Setting contacts:`, data.contacts)
            setContacts(data.contacts)
          }
        } else {
          console.log(`[fetchUserDataCallback] Etag unchanged, no updates needed`)
        }
      } else {
        console.log(`[fetchUserDataCallback] No result received from fetchUserData, keeping existing data`)
      }
    } catch (error) {
      console.error("[fetchUserDataCallback] Error fetching user data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch user data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [etag, toast])

  useEffect(() => {
    console.log("[useEffect] Checking for user in localStorage")
    const user = localStorage.getItem("currentUser")
    if (user) {
      console.log("[useEffect] User found in localStorage")
      try {
        const parsedUser = JSON.parse(user) as User
        console.log("[useEffect] Parsed user:", parsedUser)
        setCurrentUser(parsedUser)
      } catch (error) {
        console.error("[useEffect] Error parsing user from localStorage:", error)
        localStorage.removeItem("currentUser")
        router.push('/')
      }
    } else {
      console.log("[useEffect] No user found in localStorage, redirecting to home")
      router.push('/')
    }
  }, [router])

  useEffect(() => {
    if (currentUser) {
      console.log(`[useEffect] Current user set, fetching data for user ${currentUser.id}`)
      setIsLoading(true)
      fetchUserDataCallback(currentUser.id)
    } else {
      console.log("[useEffect] No current user set")
      setIsLoading(false)
    }
  }, [currentUser, fetchUserDataCallback])

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null
    if (currentUser) {
      console.log(`[useEffect] Setting up interval for user ${currentUser.id}`)
      intervalId = setInterval(() => {
        console.log(`[Interval] Fetching data for user ${currentUser.id}`)
        fetchUserDataCallback(currentUser.id)
      }, 10000)
    }
    return () => {
      if (intervalId) {
        console.log("[useEffect] Clearing interval")
        clearInterval(intervalId)
      }
    }
  }, [currentUser, fetchUserDataCallback])

  const logout = useCallback(() => {
    console.log("[logout] Logging out user")
    localStorage.removeItem("currentUser")
    setCurrentUser(null)
    setRides([])
    setContacts([])
    setEtag(null)
    router.push('/')
  }, [router])

  console.log("[render] Current state:", { 
    currentUser: currentUser ? `User ${currentUser.id}` : 'No user', 
    isLoading, 
    ridesCount: rides.length, 
    contactsCount: contacts.length,
    etag
  })

  if (isLoading || !currentUser) {
    console.log("[render] Showing loading state")
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  console.log("[render] Rendering dashboard")
  return (
    <Layout currentUser={currentUser} logout={logout}>
      <DashboardPage
        currentUser={currentUser}
        rides={rides}
        contacts={contacts}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        fetchUserData={() => {
          console.log("[fetchUserData] Manual fetch triggered")
          return fetchUserDataCallback(currentUser.id)
        }}
      />
    </Layout>
  )
}

