'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Layout from '@/components/Layout'
import { useToast } from "@/hooks/use-toast"
import { User, Ride, Contact } from "@/types"
import { fetchUserData } from "@/utils/api"
import { useOnlineStatus } from "@/utils/useOnlineStatus"

const DashboardPage = dynamic(() => import('@/components/DashboardPage'), { ssr: false });

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [rides, setRides] = useState<Ride[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [etag, setEtag] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('active') // default tab

  const router = useRouter()
  const { toast } = useToast()
  const isOnline = useOnlineStatus()

  useEffect(() => {
    const search = new URLSearchParams(window.location.search)
    if (search) {
      setActiveTab(search.get('tab') || 'active')
    }
  }, [])

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (user) {
      const parsedUser = JSON.parse(user) as User
      setCurrentUser(parsedUser)

      // Fetch initial data on mount
      void fetchUserDataCallback(parsedUser.id)
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

          // Conditionally update the states to avoid unnecessary re-renders.
          if (newEtag !== etag) {
            setEtag(newEtag)
            setRides(data.rides)
            setContacts(data.contacts)
          }
        }
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

  return (
    <Layout currentUser={currentUser} logout={logout}>
      <Suspense fallback={<div className="p-4 text-center">Hold on... Fetching your dashboard</div>}>
        {currentUser && ( // Check if currentUser is loaded before rendering DashboardPage
          <DashboardPage
            currentUser={currentUser}
            rides={rides}
            contacts={contacts}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            fetchUserData={() => fetchUserDataCallback(currentUser.id)}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}
      </Suspense>
    </Layout>
  )
}