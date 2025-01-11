'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardPage from '@/components/DashboardPage'
import Layout from '@/components/Layout'
import { Loader } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { User, Ride, Contact } from "@/types"
import { fetchUserData } from "@/utils/api"
import { useOnlineStatus } from "@/utils/useOnlineStatus"
import { TutorialProvider } from '@/contexts/TutorialContext'

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [rides, setRides] = useState<Ride[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [etag, setEtag] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('active') // default tab
  const [showTutorial, setShowTutorial] = useState(false)

  const router = useRouter()
  const { toast } = useToast()
  const isOnline = useOnlineStatus()

  // Declare the searchParams variable inside a useEffect to ensure it is only accessed on the client
  const [searchParams, setSearchParamsState] = useState<URLSearchParams | null>(null)

  useEffect(() => {
    const search = new URLSearchParams(window.location.search)
    setSearchParamsState(search)
    if (search) {
      setActiveTab(search.get('tab') || 'active')
    }
  }, [])

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (user) {
      const parsedUser = JSON.parse(user) as User
      setCurrentUser(parsedUser)
      void fetchUserDataCallback(parsedUser.id)

      // Check if the user is coming from the register page
      const fromRegister = localStorage.getItem("fromRegister")
      if (fromRegister === "true") {
        setShowTutorial(true)
        localStorage.removeItem("fromRegister") // Remove the flag after showing the tutorial
      }
    } else {
      router.push('/')
    }
  }, [router])

  const fetchUserDataCallback = async (userId: string) => {
    if (isOnline) {
      try {
        const result = await fetchUserData(userId, etag)
        if (result) {
          const { data, newEtag } = result
          if (newEtag !== etag) {
            setEtag(newEtag)
            setRides(data.rides)
            setContacts(data.contacts)
          }
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
  }

  useEffect(() => {
    if (currentUser) {
      const intervalId = setInterval(() => {
        void fetchUserDataCallback(currentUser.id)
      }, 10000)
      return () => clearInterval(intervalId)
    }
  }, [currentUser, isOnline])

  const logout = () => {
    localStorage.removeItem("currentUser")
    router.push('/')
  }

  const handleTutorialComplete = () => {
    setShowTutorial(false)
    localStorage.setItem("tutorialCompleted", "true")
  }

  return (
    <TutorialProvider>
      <Layout currentUser={currentUser} logout={logout}>
        <DashboardPage
          currentUser={currentUser!}
          rides={rides}
          contacts={contacts}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          fetchUserData={() => fetchUserDataCallback(currentUser!.id)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </Layout>
    </TutorialProvider>
  )
}

