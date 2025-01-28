'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useParams } from 'next/navigation'
import Layout from '@/components/Layout'
import { toast } from "sonner"
import { Loader } from 'lucide-react'
import { User, Ride, Contact, Notification } from "@/types"
import { fetchUserData, fetchRideDetails } from "@/utils/api"
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { ArrowBigLeft } from 'lucide-react';
import { useOnlineStatus } from "@/utils/useOnlineStatus";

const RideDetailsPage = dynamic(() => import('@/components/RideDetailsPage'), { ssr: false });

export default function RideDetails() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [ride, setRide] = useState<Ride | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [etag, setEtag] = useState<string | null>(null)

  const router = useRouter()
  const { id } = useParams()
  const searchParams = useSearchParams()
  const fromTab = searchParams.get('from') || 'available'
  const isOnline = useOnlineStatus()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('currentUser');
      if (user) {
        const parsedUser = JSON.parse(user) as User;
        setCurrentUser(parsedUser);
        void fetchUserDataCallback(parsedUser.id);
      } else {
        router.push('/');
      }
    }
  }, [router]);

  useEffect(() => {
    if (currentUser && id) {
      void fetchRideDetailsCallback(id as string)
    }
  }, [currentUser, id])

  const fetchUserDataCallback = async (userId: string) => {
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
  }

  const fetchRideDetailsCallback = async (rideId: string) => {
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
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (currentUser && id) {
      const intervalId = setInterval(() => {
        void fetchRideDetailsCallback(id as string);
      }, 10000);
      return () => clearInterval(intervalId);
    }
  }, [currentUser, id, isOnline]);

  
  return (
   <Layout currentUser={currentUser}>
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

