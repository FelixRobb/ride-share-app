'use client'

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { toast } from "sonner";

import Layout from '@/components/Layout';
import { User, AssociatedPerson } from "@/types";
import { fetchUserData } from "@/utils/api";
import { useOnlineStatus } from "@/utils/useOnlineStatus";

const CreateRidePage = dynamic(() => import('@/components/CreateRidePage'), { ssr: false });

export default function CreateRide() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [associatedPeople, setAssociatedPeople] = useState<AssociatedPerson[]>([]);
  const [etag, setEtag] = useState<string | null>(null);

  const router = useRouter();
  const isOnline = useOnlineStatus();

  const fetchUserDataCallback = useCallback(async (userId: string) => {
    if (isOnline) {
      try {
        const result = await fetchUserData(userId, etag);
        if (result) {
          const { data, newEtag } = result;
          setEtag(newEtag);
          setAssociatedPeople(data.associatedPeople);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to fetch user data. Please try again.");
      }
    }
  }, [etag, isOnline]);

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
    if (currentUser) {
      const intervalId = setInterval(() => {
        void fetchUserDataCallback(currentUser.id);
      }, 10000);
      return () => clearInterval(intervalId);
    }
  }, [currentUser, fetchUserDataCallback, isOnline]);


  return (
    <Layout>
      <Suspense fallback={<div className="p-4 text-center">Hold on... Fetching ride details</div>}>
        {currentUser && (
          <CreateRidePage
            currentUser={currentUser}
            fetchUserData={() => fetchUserDataCallback(currentUser.id)}
            setCurrentPage={(page) => router.push(`/${page}`)}
            associatedPeople={associatedPeople}
          />
        )}
      </Suspense>
    </Layout>
  );
}

