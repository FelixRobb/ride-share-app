'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import RideDetailsPage from '@/components/RideDetailsPage'
import Layout from '@/components/Layout'
import { useToast } from "@/hooks/use-toast"
import { User, Ride, Contact, Notification } from "@/types"
import { fetchUserData, fetchRideDetails } from "@/utils/api"

export default function RideDetails() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [ride, setRide] = useState<Ride | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [etag, setEtag] = useState<string | null>(null)

  const router = useRouter()
  const { id } = useParams()
  const { toast } = useToast()

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (user) {
      const parsedUser = JSON.parse(user) as User
      setCurrentUser(parsedUser)
      void fetchUserDataCallback(parsedUser.id)
      void fetchRideDetailsCallback(id as string)
    } else {
      router.push('/')
    }
  }, [router, id])

  const fetchUserDataCallback = async (userId: string) => {
    try {
      const result = await fetchUserData(userId, etag)
      if (result) {
        const { data, newEtag } = result
        setEtag(newEtag)
        setContacts(data.contacts)
        setNotifications((prev) => [...prev, ...data.notifications])
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

  const fetchRideDetailsCallback = async (rideId: string) => {
    try {
      const rideDetails = await fetchRideDetails(rideId)
      setRide(rideDetails)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching ride details:", error)
      toast({
        title: "Error",
        description: "Failed to fetch ride details. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("currentUser")
    router.push('/')
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <Layout currentUser={currentUser} notifications={notifications} logout={logout}>
      {ride && (
        <RideDetailsPage
          ride={ride}
          currentUser={currentUser!}
          contacts={contacts}
          fetchUserData={() => fetchUserDataCallback(currentUser!.id)}
        />
      )}
    </Layout>
  )
}

