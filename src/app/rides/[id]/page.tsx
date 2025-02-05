'use client'

import { ArrowBigLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation'
import { useParams } from 'next/navigation'
import { useState, useEffect, Suspense, useCallback } from 'react'
import { toast } from "sonner"

import Layout from '@/components/Layout'
import { Button } from "@/components/ui/button";
import { User, Ride, Contact } from "@/types"
import { fetchUserData, fetchRideDetails } from "@/utils/api"
import { useOnlineStatus } from "@/utils/useOnlineStatus";

const RideDetailsPage = dynamic(() => import('@/components/RideDetailsPage'), { ssr: false });

export default function RideDetails() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [ride, setRide] = useState<Ride | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [etag, setEtag] = useState<string | null>(null)

  const router = useRouter()
  const { id } = useParams()
  const searchParams = useSearchParams()
  const fromTab = searchParams.get('from') || 'available'
  const isOnline = useOnlineStatus()

  const fetchUserDataCallback = useCallback(async (userId: string) => {
    if (isOnline) {
      try {
        const result = await fetchUserData(userId, etag)
        if (result) {
          const { data, newEtag } = result
          setEtag(newEtag)
          setContacts(data.contacts)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast.error("Failed to fetch user data. Please try again."); // Update: Replaced toast call
      }
    }
  }, [isOnline, etag]);

  const fetchRideDetailsCallback = useCallback(async (rideId: string) => {
    if (isOnline) {
      try {
        if (!currentUser) {
          throw new Error("User not authenticated");
        }
        const rideDetails = await fetchRideDetails(currentUser.id, rideId);
        setRide(rideDetails);
      } catch (error) {
        console.error("Error fetching ride details:", error);
        toast.error("Failed to fetch ride details, or you don't have permission to see this ride. Please go back."); // Update: Replaced toast call
      }
    }
  }, [isOnline, currentUser]);
  
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
    if (currentUser && id) {
      void fetchRideDetailsCallback(id as string)
    }
  }, [currentUser, fetchRideDetailsCallback, id])

  useEffect(() => {
    if (currentUser && id) {
      const intervalId = setInterval(() => {
        void fetchRideDetailsCallback(id as string);
      }, 10000);
      return () => clearInterval(intervalId);
    }
  }, [currentUser, fetchRideDetailsCallback, id, isOnline]);


  return (
    <Layout>
      <Button type="button" variant="ghost" onClick={() => router.push(`/dashboard?tab=${fromTab}`)} className='mb-2'><ArrowBigLeft />Go Back to Dashboard</Button>
      <Suspense fallback={<div className="p-4 text-center">Hold on... Fetching ride details</div>}>
        {ride && currentUser && (
          <RideDetailsPage
            ride={ride}
            currentUser={currentUser}
            contacts={contacts}
            fetchUserData={() => fetchUserDataCallback(currentUser.id)}
          />
        )}
      </Suspense>
    </Layout>
  )
}

